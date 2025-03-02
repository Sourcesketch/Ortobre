import React, { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";
import { motion } from "framer-motion";
import Reports from "./Reports";
import {
  ArrowUpDown,
  ToggleLeft,
  ToggleRight,
  Box,
  ClockArrowUp,
  UserCog,
  FileChartColumnIncreasing,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import Dashboard from "../Pages/Dashboard";

const AdminDashboard = ({ session, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("products");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productMessage, setProductMessage] = useState("");
  const [form, setForm] = useState({
    id: null,
    type: "",
    variety: "",
    quality: "",
    maxQuantity: "",
    basePrice: "",
    hourlyPriceDrop: "10",
    unit: "",
    description: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [preorderStart, setPreorderStart] = useState("");
  const [preorderEnd, setPreorderEnd] = useState("");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [preorderingEnabled, setPreorderingEnabled] = useState(true);
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userMessage, setUserMessage] = useState("");

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts();
    fetchSettings();
    fetchUsers();
  }, []);

  // PRODUCT FUNCTIONS
  const fetchProducts = async () => {
    setProductLoading(true);
    const { data, error } = await supabase.from("products").select("*");
    if (error) {
      setProductMessage(error.message);
    } else {
      setProducts(data);
    }
    setProductLoading(false);
  };

  const computeProductName = (type, variety, quality) => {
    return [type, variety, quality]
      .filter((val) => val && val.trim() !== "")
      .join(" ");
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProductLoading(true);
    setProductMessage(""); // Clear any previous messages

    // Basic validation
    if (!form.type.trim()) {
      setProductMessage("Type is required.");
      setProductLoading(false);
      return;
    }

    // Prepare the payload
    const productName = computeProductName(form.type, form.variety, form.quality);
    const payload = {
      name: productName,
      type: form.type,
      variety: form.variety,
      quality: form.quality,
      max_quantity: parseInt(form.maxQuantity, 10),
      remaining_stock: parseInt(form.maxQuantity, 10),
      base_price: parseFloat(form.basePrice),
      hourly_price_drop: parseFloat(form.hourlyPriceDrop),
      unit: form.unit,
      description: form.description,
    };

    try {
      if (isEditing) {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", form.id);

        if (error) throw error;
        setProductMessage("Product updated successfully!");
      } else {
        // Add new product
        payload.enabled = true; // Default to enabled for new products
        const { error } = await supabase.from("products").insert([payload]);

        if (error) throw error;
        setProductMessage("Product added successfully!");
      }

      // Reset form and fetch updated products
      resetForm();
      fetchProducts();
    } catch (error) {
      setProductMessage(error.message || "An error occurred. Please try again.");
    } finally {
      setProductLoading(false);
    }
  };

  const handleEdit = (product) => {
    setIsEditing(true);
    setForm({
      id: product.id,
      type: product.type,
      variety: product.variety,
      quality: product.quality,
      maxQuantity: product.max_quantity,
      basePrice: product.base_price,
      hourlyPriceDrop: product.hourly_price_drop.toString(),
      unit: product.unit,
      description: product.description,
    });
  };

  // const handleDelete = async (id) => {
  //   console.log("Deleting product with ID:", id); // Debugging line
  //   setProductLoading(true);
  //   const { error } = await supabase.from("products").delete().eq("id", id);
  //   if (error) {
  //     console.error("Error deleting product:", error); // Debugging line
  //     setProductMessage(error.message);
  //   } else {
  //     setProductMessage("Product deleted successfully!");
  //     fetchProducts(); // Refresh the product list
  //   }
  //   setProductLoading(false);
  // };
  const handleDelete = async (id) => {
    setProductLoading(true);
  
    try {
      // Step 1: Delete all preorders associated with the product
      const { error: preorderError } = await supabase
        .from("preorders")
        .delete()
        .eq("product_id", id);
  
      if (preorderError) throw preorderError;
  
      // Step 2: Delete the product
      const { error: productError } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
  
      if (productError) throw productError;
  
      setProductMessage("Product and associated preorders deleted successfully!");
      fetchProducts(); // Refresh the product list
    } catch (error) {
      console.error("Error deleting product:", error);
      setProductMessage(error.message);
    } finally {
      setProductLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      id: null,
      type: "",
      variety: "",
      quality: "",
      maxQuantity: "",
      basePrice: "",
      hourlyPriceDrop: "10",
      unit: "",
      description: "",
    });
    setIsEditing(false);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];
    if (typeof valA === "string") {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleToggleEnabled = async (product) => {
    const newEnabled = !product.enabled;
    const { error } = await supabase
      .from("products")
      .update({ enabled: newEnabled })
      .eq("id", product.id);
    if (error) {
      setProductMessage(error.message);
    } else {
      setProductMessage(
        `Product ${newEnabled ? "enabled" : "disabled"} successfully!`
      );
      fetchProducts();
    }
  };

  // PREORDER FUNCTIONS
  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (error) {
      console.error("Error fetching settings:", error.message);
    } else {
      setPreorderStart(data.preorder_start);
      setPreorderEnd(data.preorder_end);
      setPreorderingEnabled(data.preordering_enabled);
    }
  };

  const handleAvailabilityUpdate = async (e) => {
    e.preventDefault();
    setAvailabilityLoading(true);
    const { error } = await supabase
      .from("settings")
      .update({
        preorder_start: preorderStart,
        preorder_end: preorderEnd,
        preordering_enabled: preorderingEnabled,
      })
      .eq("id", 1);
    if (error) {
      setAvailabilityMessage(error.message);
    } else {
      setAvailabilityMessage("Preorder availability updated successfully!");
    }
    setAvailabilityLoading(false);
  };

  // USER MANAGEMENT FUNCTIONS
  const fetchUsers = async () => {
    setUserLoading(true);
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      setUserMessage(error.message);
    } else {
      setUsers(data);
    }
    setUserLoading(false);
  };

  const promoteUser = async (userId) => {
    setUserLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", userId);
    if (error) {
      setUserMessage(error.message);
    } else {
      setUserMessage("User promoted to admin successfully!");
      fetchUsers();
    }
    setUserLoading(false);
  };

  return (
    <div className="flex">
      {/* SIDE NAVIGATION */}
      <aside className="hidden md:flex flex-col w-64 custom-h bg-gray-800 text-white p-5 fixed">
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
            onClick={() => setSelectedTab("preorder")}
            className={`text-left w-full px-4 py-2 rounded flex items-center gap-1.5 ${
              selectedTab === "preorder" ? "bg-indigo-600" : "hover:bg-gray-700"
            }`}
          >
            <ClockArrowUp className="w-5 h-5" />
            Preorder
          </button>
          <button
            onClick={() => setSelectedTab("users")}
            className={`text-left w-full px-4 py-2 rounded flex items-center gap-1.5 ${
              selectedTab === "users" ? "bg-indigo-600" : "hover:bg-gray-700"
            }`}
          >
            <UserCog className="w-5 h-5" />
            User Management
          </button>
          <button
            onClick={() => setSelectedTab("reports")}
            className={`text-left w-full px-4 py-2 rounded flex items-center gap-1.5 ${
              selectedTab === "reports" ? "bg-indigo-600" : "hover:bg-gray-700"
            }`}
          >
            <FileChartColumnIncreasing className="w-5 h-5" />
            Reports
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
                onClick={() => setSelectedTab("preorder")}
                className={`text-left w-full px-4 py-2 rounded flex items-center gap-1.5 ${
                  selectedTab === "preorder"
                    ? "bg-indigo-600"
                    : "hover:bg-gray-700"
                }`}
              >
                <ClockArrowUp className="w-5 h-5" />
                Preorder
              </button>
              <button
                onClick={() => setSelectedTab("users")}
                className={`text-left w-full px-4 py-2 rounded flex items-center gap-1.5 ${
                  selectedTab === "users"
                    ? "bg-indigo-600"
                    : "hover:bg-gray-700"
                }`}
              >
                <UserCog className="w-5 h-5" />
                User Management
              </button>
              <button
                onClick={() => setSelectedTab("reports")}
                className={`text-left w-full px-4 py-2 rounded flex items-center gap-1.5 ${
                  selectedTab === "reports"
                    ? "bg-indigo-600"
                    : "hover:bg-gray-700"
                }`}
              >
                <FileChartColumnIncreasing className="w-5 h-5" />
                Reports
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow p-6 custom-h flex flex-col space-y-4 md:w-full custom-w ml-0 md:ml-64 overflow-auto">
        {/* PRODUCTS TAB */}
        {selectedTab === "products" && (
          <>
            {/* Product Combination Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Available Product Combinations
                </h2>
                {productMessage && (
                  <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
                    {productMessage}
                  </div>
                )}
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type*
                    </label>
                    <input
                      type="text"
                      name="type"
                      value={form.type}
                      onChange={handleInputChange}
                      className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Variety
                    </label>
                    <input
                      type="text"
                      name="variety"
                      value={form.variety}
                      onChange={handleInputChange}
                      className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quality
                    </label>
                    <input
                      type="text"
                      name="quality"
                      value={form.quality}
                      onChange={handleInputChange}
                      className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Max Quantity
                    </label>
                    <input
                      type="number"
                      name="maxQuantity"
                      value={form.maxQuantity}
                      onChange={handleInputChange}
                      className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Base Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="basePrice"
                      value={form.basePrice}
                      onChange={handleInputChange}
                      className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Hourly Price Drop (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="hourlyPriceDrop"
                      value={form.hourlyPriceDrop}
                      onChange={handleInputChange}
                      className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unit
                    </label>
                    <input
                      type="text"
                      name="unit"
                      value={form.unit}
                      onChange={handleInputChange}
                      className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., kg, pc, basket"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={form.description}
                      onChange={handleInputChange}
                      className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      type="submit"
                      disabled={productLoading}
                      className="inline-flex items-center whitespace-nowrap px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {isEditing ? "Update Product" : "Add Product"}
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={productLoading}
                        className="inline-flex items-center px-4 py-2 bg-gray-500 border border-transparent rounded-md font-semibold text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
            {/* Products Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full flex md:flex-1 overflow-x-auto overflow-y-auto"
            >
              <div className="bg-white shadow rounded-lg ">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        onClick={() => handleSort("name")}
                        className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product{" "}
                        <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                      </th>
                      <th
                        onClick={() => handleSort("type")}
                        className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Type{" "}
                        <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                      </th>
                      <th
                        onClick={() => handleSort("variety")}
                        className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Variety{" "}
                        <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                      </th>
                      <th
                        onClick={() => handleSort("quality")}
                        className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Quality{" "}
                        <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                      </th>
                      <th
                        onClick={() => handleSort("max_quantity")}
                        className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Max Quantity{" "}
                        <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                      </th>
                      <th
                        onClick={() => handleSort("base_price")}
                        className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Base Price{" "}
                        <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                      </th>
                      <th
                        onClick={() => handleSort("hourly_price_drop")}
                        className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Hourly Price Drop (%){" "}
                        <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                      </th>
                      <th
                        onClick={() => handleSort("unit")}
                        className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Unit{" "}
                        <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                      </th>
                      <th
                        onClick={() => handleSort("description")}
                        className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-100"
                      >
                        Description{" "}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enabled
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.variety}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.quality}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.max_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${product.base_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.hourly_price_drop}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleToggleEnabled(product)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {product.enabled ? (
                              <ToggleRight className="w-6 h-6" />
                            ) : (
                              <ToggleLeft className="w-6 h-6" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900 mr-4"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td
                          colSpan="11"
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No products available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}

        {/* PREORDER TAB */}
        {selectedTab === "preorder" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Preorder Availability
            </h2>
            {availabilityMessage && (
              <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
                {availabilityMessage}
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <form
                  onSubmit={handleAvailabilityUpdate}
                  className="grid xs:grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 items-center gap-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Preorder Start
                    </label>
                    <input
                      type="time"
                      name="preorderStart"
                      value={preorderStart}
                      onChange={(e) => setPreorderStart(e.target.value)}
                      className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Preorder End
                    </label>
                    <input
                      type="time"
                      name="preorderEnd"
                      value={preorderEnd}
                      onChange={(e) => setPreorderEnd(e.target.value)}
                      className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  {/* New Switch for "Not available today" */}
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={!preorderingEnabled}
                        onChange={(e) =>
                          setPreorderingEnabled(!e.target.checked)
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Not available today
                      </span>
                    </label>
                  </div>
                  <div className="col-span-2 flex items-center space-x-4">
                    <button
                      type="submit"
                      disabled={availabilityLoading}
                      className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Update Availability
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* USER MANAGEMENT TAB */}
        {selectedTab === "users" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              User Management
            </h2>
            {userMessage && (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
                {userMessage}
              </div>
            )}
            {userLoading ? (
              <p>Loading users...</p>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full"
              >
                <div className="overflow-x-auto rounded-lg shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Surname
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.username || user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.surname || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.phone || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.role}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {user.role !== "admin" && (
                              <button
                                onClick={() => promoteUser(user.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Promote to Admin
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>
        )}
        {selectedTab === "reports" && <Reports session={session} />}
      </main>
    </div>
  );
};

export default AdminDashboard;