import sys
import json

def allocate_routes():
    try:
        raw_input = sys.stdin.read()
        if not raw_input:
            print(json.dumps({"routes": [], "unallocatedOrderIds": []}))
            return
            
        data = json.loads(raw_input)
        vehicles = data.get("vehicles", [])
        orders = data.get("orders", [])
        
        routes = []
        unallocated_orders = list(orders)
        
        for vehicle in vehicles:
            if not unallocated_orders:
                break
                
            capacity_weight = vehicle.get("capacityWeight", 0)
            capacity_cases = vehicle.get("capacityCases", 0)
            
            curr_weight = 0
            curr_cases = 0
            assigned_stops = []
            remaining_orders = []
            
            for order in unallocated_orders:
                o_weight = order.get("weight", 0)
                o_cases = order.get("cases", 0)
                
                if (curr_weight + o_weight <= capacity_weight) and (curr_cases + o_cases <= capacity_cases):
                    curr_weight += o_weight
                    curr_cases += o_cases
                    assigned_stops.append({
                        "orderId": order["id"],
                        "sequenceOrder": len(assigned_stops) + 1
                    })
                else:
                    remaining_orders.append(order)
                    
            unallocated_orders = remaining_orders
            
            if assigned_stops:
                routes.append({
                    "vehicleId": vehicle["id"],
                    "driverId": vehicle["driverId"],
                    "stops": assigned_stops
                })
                
        result = {
            "routes": routes,
            "unallocatedOrderIds": [o["id"] for o in unallocated_orders]
        }
        
        print(json.dumps(result))
    except Exception as e:
        sys.stderr.write(f"Error in python allocation script: {str(e)}\n")
        sys.exit(1)

if __name__ == "__main__":
    allocate_routes()
