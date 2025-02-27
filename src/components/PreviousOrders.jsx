import React, { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";
import { motion } from "framer-motion";

const PreviousOrders = ({ session }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fetch orders for the current user
  const fetchOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from("preorders")
      .select(
        `
          id,
          quantity,
          order_date,
          products (
            name,
            base_price
          )
        `
      )
      .eq("user_id", session.user.id)
      .order("order_date", { ascending: false });
    if (error) {
      console.error("Error fetching orders:", error.message);
    } else {
      setOrders(data);
    }
    setLoadingOrders(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [session.user.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          My Orders
        </h3>
      <div className="bg-white p-2 rounded-lg shadow-md mt-8"> 
      
        {loadingOrders ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                    Order ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                    Base Price
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                    Order Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {order.products.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {order.quantity}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      ${parseFloat(order.products.base_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {new Date(order.order_date).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default PreviousOrders;
