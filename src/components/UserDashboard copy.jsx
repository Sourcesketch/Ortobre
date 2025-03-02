// src/components/UserDashboard.jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";
import toast, { Toaster } from "react-hot-toast";
import UserProfile from "./UserProfile";
import PreviousOrders from "./PreviousOrders";
import { Box, LogOut, Menu, ShoppingCart, UserPen, X } from "lucide-react";

const UserDashboard = ({ session, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Tab selection state: "products", "profile", "previous orders"
  const [selectedTab, setSelectedTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [expanded, setExpanded] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    console.log(today, "today");
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, description, base_price,type, variety, max_quantity, remaining_stock"
      )
      .eq("available_date", today);
    if (error) {
      console.error("Error fetching products:", error.message);
    } else {
      console.log(data, "dataaaaaaaa");
      setProducts(data);

    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Dynamic pricing calculation:
  // For example, if the discount is 10% per hour after 7 PM:
  const calculateDynamicPrice = (basePrice) => {
    const now = new Date();
    const startTime = new Date();
    // Assume discount starts at 19:00 local time.
    startTime.setHours(19, 0, 0, 0);
    let hoursElapsed = 0;
    if (now > startTime) {
      hoursElapsed = Math.floor((now - startTime) / (1000 * 60 * 60));
    }
    const discountRate = 0.1; // 10% discount per hour
    let discount = basePrice * discountRate * hoursElapsed;
    let dynamicPrice = basePrice - discount;
    if (dynamicPrice < 0) dynamicPrice = 0;
    return dynamicPrice.toFixed(2);
  };

  // Update selected quantity for a product
  const handleQuantityChange = (productId, value) => {
    setSelectedQuantities({
      ...selectedQuantities,
      [productId]: value,
    });
  };
  // Render dropdown options based on the lower of max_quantity and remaining_stock.
  const renderQuantityOptions = (product) => {
    // Use remaining_stock if defined; otherwise max_quantity.
    const availableStock =
      product.remaining_stock !== null && product.remaining_stock !== undefined
        ? product.remaining_stock
        : product.max_quantity;
    const limit = Math.min(product.max_quantity, availableStock);
    const options = [];
    for (let i = 1; i <= limit; i++) {
      options.push(
        <option key={i} value={i}>
          {i}
        </option>
      );
    }
    return options;
  };

  // Handle preorder submission: store in preorders table and update remaining_stock.
  const handlePreorder = async (product) => {
    const quantity = selectedQuantities[product.id] || 1;

    try {
      // Insert the preorder record (optionally, include user_id if available)
      const { error: preorderError } = await supabase.from("preorders").insert([
        {
          product_id: product.id,
          user_id: session.user.id, // Include if you are tracking users
          profile_id: session.user.id, // Include if you are tracking profile for users
          quantity,
          order_date: new Date().toISOString(),
        },
      ]);

      if (preorderError) throw preorderError;

      // Calculate the new remaining stock.
      const currentRemaining =
        product.remaining_stock !== null &&
        product.remaining_stock !== undefined
          ? product.remaining_stock
          : product.max_quantity;
      const newRemainingStock = currentRemaining - quantity;

      // Update the product record with the new remaining stock.
      const { error: updateError } = await supabase
        .from("products")
        .update({ remaining_stock: newRemainingStock })
        .eq("id", product.id);

      if (updateError) throw updateError;

      toast.success(
        `Preorder confirmed for ${quantity} of ${product.name}. Please pay upon collection.`
      );
      fetchProducts(); // Refresh the product list to show updated stock.
    } catch (error) {
      toast.error(`Error processing preordering: ${error.message}`);
    }
  };

  return (
    <div className="flex">
      {/* Fixed Side Navigation */}
      {/* <aside className="fixed left-0 w-232 bg-gray-800 text-white p-4 custom-h ">
        <nav className="flex flex-col space-y-4 w-full">
        <button
            onClick={() => setSelectedTab("products")}
            className={`text-left w-full px-4 py-2 rounded flex items-center gap-1.5 ${
              selectedTab === "products" ? "bg-indigo-600" : "hover:bg-gray-700"
            }`}
          >
            <Box className="w-5 h-5"/>
            Products
          </button>
        
        </nav>
        <nav className="flex flex-col space-y-4 w-full">
        <button
            onClick={() => setSelectedTab("profile")}
            className={`text-left w-full px-4 py-2 rounded flex items-center gap-1.5 ${
              selectedTab === "profile" ? "bg-indigo-600" : "hover:bg-gray-700"
            }`}
          >
            <UserPen className="w-5 h-5"/>
            Profile 
          </button>
           
        </nav>
        <nav className="flex flex-col space-y-4 w-full">
        <button
            onClick={() => setSelectedTab("previousOrders")}
            className={`text-left w-full px-4 py-2 rounded  flex items-center gap-1.5 ${
              selectedTab === "previousOrders" ? "bg-indigo-600" : "hover:bg-gray-700"
            }`}
          >
            <ShoppingCart className="w-5 h-5"/>
            Previous Orders 
          </button>
       
        </nav>
        
      </aside> */}

      {/* Desktop Sidebar (Visible on ≥ 768px) */}
      <aside className="hidden lg:flex flex-col w-64 custom-h bg-gray-800 text-white p-5 fixed">
        <h1 className="text-2xl font-bold mb-2"></h1>
        <nav className="space-y-4">
          <button
            onClick={() => setSelectedTab("products")}
            className={`text-left w-full px-4 py-2 rounded flex items-center gap-1.5 ${
              selectedTab === "products" ? "bg-indigo-600" : "hover:bg-gray-700"
            }`}
          >
            <Box className="w-5 h-5" />
            Products
          </button>
          <button
            onClick={() => setSelectedTab("profile")}
            className={`text-left w-full px-4 py-2 rounded flex items-center gap-1.5 ${
              selectedTab === "profile" ? "bg-indigo-600" : "hover:bg-gray-700"
            }`}
          >
            <UserPen className="w-5 h-5" />
            Profile
          </button>
          <button
            onClick={() => setSelectedTab("previousOrders")}
            className={`text-left w-full px-4 py-2 rounded  flex items-center gap-1.5 ${
              selectedTab === "previousOrders"
                ? "bg-indigo-600"
                : "hover:bg-gray-700"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            Previous Orders
          </button>
        </nav>
      </aside>

      {/* Mobile Menu Button (Visible on < 768px) */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 bg-gray-800 text-white p-3 rounded-full shadow-lg z-52"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Sidebar & Overlay (Visible when open) */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 custom-bg-overlay bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Sidebar */}
          <aside className="fixed top-0 left-0 w-64 custom-h bg-gray-800 text-white p-5 z-50 transition-transform transform translate-x-0">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <h1 className="text-2xl font-bold mb-14"></h1>
            <nav className="space-y-4">
              <button
                onClick={() => setSelectedTab("products")}
                className={`text-left w-full px-4 py-2 rounded flex items-center gap-1.5 ${
                  selectedTab === "products"
                    ? "bg-indigo-600"
                    : "hover:bg-gray-700"
                }`}
              >
                <Box className="w-5 h-5" />
                Products
              </button>
              <button
                onClick={() => setSelectedTab("profile")}
                className={`text-left w-full px-4 py-2 rounded flex items-center gap-1.5 ${
                  selectedTab === "profile"
                    ? "bg-indigo-600"
                    : "hover:bg-gray-700"
                }`}
              >
                <UserPen className="w-5 h-5" />
                Profile
              </button>
              <button
                onClick={() => setSelectedTab("previousOrders")}
                className={`text-left w-full px-4 py-2 rounded  flex items-center gap-1.5 ${
                  selectedTab === "previousOrders"
                    ? "bg-indigo-600"
                    : "hover:bg-gray-700"
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                Previous Orders
              </button>
            </nav>
            <button
              onClick={onLogout}
              className="mt-2 flex items-center p-4  text-red-400 hover:bg-red-500/10 rounded"
            >
              <LogOut className="w-5 h-5 me-2" />
              Logout
            </button>
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:h-screen custom-h flex flex-col space-y-4 lg:w-full custom-w ml-0 lg:ml-64 overflow-auto">
        {selectedTab === "products" && (
          <div className="p-6">
            <Toaster position="top-right" />
            <h1 className="text-2xl font-semibold mb-4">
              Available Products Today
            </h1>
            {loading ? (
              <p>Loading products...</p>
            ) : products.length === 0 ? (
              <p className="text-gray-500">No products available today.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-[minmax(0,1fr)]">
                {products.map((product) => (
                  <div
                    className="px-4 py-3 bg-white shadow-md hover:shadow-xl duration-500 rounded-lg flex flex-col"
                    key={product.id}
                  >
                    <span className="text-gray-400 mr-3 uppercase text-xs">
                      {product.type}
                    </span>
                    <p className="text-lg font-bold text-black truncate block capitalize">
                      {product.name}
                    </p>
                    <p
                      className={`text-gray-600 mt-1 flex-grow ${
                        !expanded ? "line-clamp-2" : ""
                      }`}
                    >
                      {product.description}
                    </p>
                    {product.description &&
                      product.description.length > 100 && (
                        <button
                          onClick={() => setExpanded(!expanded)}
                          className="text-sm text-blue-500 hover:underline text-left"
                        >
                          {expanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-2xl font-bold text-black cursor-auto my-3">
                          ${calculateDynamicPrice(product.base_price)}
                        </p>
                        <del>
                          <p className="text-sm text-gray-600 cursor-auto ml-2">
                            ${product.base_price}
                          </p>
                        </del>
                      </div>
                      <div className="mt-2 d-flex flex-wrap items-end">
                        <label className="text-xs text-gray-700">
                          Select Quantity:
                        </label>
                        <select
                          className="ml-2 border border-gray-300 rounded p-1"
                          value={selectedQuantities[product.id] || 1}
                          onChange={(e) =>
                            handleQuantityChange(
                              product.id,
                              parseInt(e.target.value)
                            )
                          }
                        >
                          {renderQuantityOptions(product)}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePreorder(product)}
                      className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors w-full"
                    >
                      Preorder
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {selectedTab === "profile" && <UserProfile session={session} />}
        {selectedTab === "previousOrders" && (
          <PreviousOrders session={session} />
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
