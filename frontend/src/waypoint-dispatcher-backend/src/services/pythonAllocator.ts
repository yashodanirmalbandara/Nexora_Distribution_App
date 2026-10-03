import { spawn } from 'child_process';
import path from 'path';

export interface AllocationPayload {
  vehicles: Array<{
    id: string;
    driverId: string;
    capacityWeight: number;
    capacityCases: number;
  }>;
  orders: Array<{
    id: string;
    cases: number;
    weight: number;
    latitude: number;
    longitude: number;
    deliveryWindowStart: string;
    deliveryWindowEnd: string;
  }>;
}

export interface AllocatedRoute {
  vehicleId: string;
  driverId: string;
  stops: Array<{
    orderId: string;
    sequenceOrder: number;
  }>;
}

export interface AllocationResult {
  routes: AllocatedRoute[];
  unallocatedOrderIds: string[];
}

/**
 * Spawns the check_allocation.py process safely, piping JSON via stdin and reading JSON from stdout.
 */
export async function runPythonAllocator(
  payload: AllocationPayload,
  timeoutMs: number = 30000
): Promise<AllocationResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, '../../scripts/check_allocation.py');
    const pythonProcess = spawn('python3', [scriptPath]);

    let stdoutData = '';
    let stderrData = '';

    const timer = setTimeout(() => {
      pythonProcess.kill('SIGTERM');
      reject(new Error(`Python allocation script timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start python script: ${err.message}`));
    });

    pythonProcess.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(
          new Error(`Python script exited with code ${code}. Error: ${stderrData}`)
        );
      }

      try {
        const parsedResult: AllocationResult = JSON.parse(stdoutData);
        resolve(parsedResult);
      } catch (err) {
        reject(
          new Error(
            `Failed to parse Python script JSON output: ${(err as Error).message}. Raw output: ${stdoutData}`
          )
        );
      }
    });

    // Send payload via STDIN and close stream
    pythonProcess.stdin.write(JSON.stringify(payload));
    pythonProcess.stdin.end();
  });
}
