/**
 * This is Order Management System
 */
const fs = require('fs');
const csv=require('csvtojson');

// This is a datastructure with two way pointers. 
// dependsOn contains list of orders this order depends upon
// dependant_orders contains list of orders that need to fullfilled prior to this order
function Order(id, name) {
    this.id = id;
    this.name = name;
    this.dependsOn = []; //  Pointer to orders that this order depends upon
    this.dependant_orders = []; // Pointers to orders that depend on this order.
}

// Order Management System
class OrderSystem {
    constructor() {
        this.map = new Map(); // Using Map Strructure for key = orderId, value = orderDetails
        this.tabCount = 0;
    }
    // Add Order
    addOrder(order) {
        this.map.set( order.id, order);
    }
    // Use this function to create dependency 'Links' between orders. 
    addDependencies(fromOrderId, toOrderId) {
        const fromOrder = this.map.get(fromOrderId);
        if( ! fromOrder  ) return false;
        fromOrder.dependsOn.push( toOrderId);

        const toOrder = this.map.get(toOrderId);
        if( ! toOrder  ) return false;

        toOrder.dependant_orders.push( fromOrderId);
    }

    // This is recursive function to print dependencies
    printDependentOrders( orderId, stream) {
        const orderDetail = this.map.get(orderId);
        if (orderDetail.dependant_orders.length != 0 ) {
                let outputStr = '\t'.repeat(this.tabCount) + `Dependencies\n`; // Indent Tabs based on Depth
                if(!stream)
                    console.log(outputStr);
                else
                    stream.write(outputStr);

                this.tabCount = this.tabCount + 1;

                orderDetail.dependant_orders.map( (orderId) => {
                        const requiredOrder = this.map.get(orderId); 
                        outputStr = '\t'.repeat(this.tabCount) + `Id ${orderId}, Name: ${requiredOrder.name}\n`
                        if(!stream)
                             console.log(outputStr);
                        else
                            stream.write(outputStr);                        // Recursively print all dependent orders
                        this.printDependentOrders(orderId, stream);
                        } )
                    }
    }
    // Print according to reporting requirments
    print(stream) {
        const self = this;
        this.map.forEach(function(orderDetail, orderId) {
            if( orderDetail.dependsOn.length ===0 ) {// Print only top level Orders
                let outputStr = `Id ${orderId}, Name: ${orderDetail.name}\n`;
                if(!stream)
                    console.log(outputStr);
                else
                    stream.write(outputStr);
                self.tabCount = 0;

                self.printDependentOrders(orderId, stream)
            }
        });
    }
    printFile(fileName) {
        var fstream = fs.createWriteStream(fileName);
        this.print(fstream);
        fstream.end();
    }

}
// Use this function to test without reading through the files
function test() {
        var orderSystem = new OrderSystem();
        orderSystem.addOrder( new Order( '1', 'First'));

       orderSystem.addOrder( new Order( '2', 'Second'));
       orderSystem.addOrder( new Order( '3', 'Third'));
       orderSystem.addOrder( new Order( '4', 'Fourth'));
       orderSystem.addOrder( new Order( '5', 'Fifth'));
       orderSystem.addOrder( new Order( '6', 'Sixth'));

        orderSystem.addDependencies( '2', '1' );
        orderSystem.addDependencies( '3', '1' );
        orderSystem.addDependencies( '4', '3' );
        orderSystem.addDependencies( '2', '5' );
        orderSystem.addDependencies( '6', '3' );

        orderSystem.print();
        
       
}


// First Read Order Dependencies.
 async function   read_cvs(fileName) {
    const jsonArray= await csv().fromFile(fileName);
    return jsonArray;
}


// How to Run 
// By default program will take example2/orders.txt and example2/dependencies.txt files
// To Run in default mode
// node inde  
// To provide arguments try this
// node index  --output anotheroutput.txt --orders input/orders.txt --dependency input/dependencies.txt
function main() {
    const argv = require('yargs')
                    .default('output', 'output.txt') // if --output parameter isn't defined use output.txt
                    .default('orders', 'example2/orders.txt')
                    .default('dependency', 'example2/dependencies.txt')
                    .argv;

    
    var orderSystem = new OrderSystem();  

    const p1 = read_cvs(argv.orders); // this function returns a promise
    const p2 = read_cvs(argv.dependency); // this function returns a promise
    Promise.all([p1, p2]).then( // Wait for both the promises to be fulfilled.
      
        ([orders, dependencies]) => {         
            // Add Orders
            orders.map( (order) => {  orderSystem.addOrder( new Order( order.id, order.name)); } );
            // Add Dependencies
            dependencies.map( (de) => {  orderSystem.addDependencies(de.dependency_id, de.id )});
            
            console.log('Writing to ', argv.output );
            orderSystem.printFile(argv.output);
            //orderSystem.print();

        }

    );


}

// Call Main Function
main();

