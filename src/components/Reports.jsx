import React, { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { ArrowUpDown } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import ReportPDF from "./ReportPdf"; // Import the PDF component


// Helper function to compute product name
const computeProductName = (type, variety, quality) => {
  return [type, variety, quality].filter((val) => val && val.trim() !== "").join(" ");
};

// Function to download PDF 
const downloadPDF = async (reportType, reportDate, data) => {
  const doc = <ReportPDF reportType={reportType} reportDate={reportDate} data={data} />;
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = reportType === "preorders" ? "Completed_Preorders_Report.pdf" : "Leftover_Stock_Report.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
const Reports = ({ session }) => {
  const [reportTab, setReportTab] = useState("preorders");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);

  const [preordersSortColumn, setPreordersSortColumn] = useState("id");
  const [preordersSortDirection, setPreordersSortDirection] = useState("asc");

  const [leftoverSortColumn, setLeftoverSortColumn] = useState("name");
  const [leftoverSortDirection, setLeftoverSortDirection] = useState("asc");

  const [preorders, setPreorders] = useState([]);
  const [preordersLoading, setPreordersLoading] = useState(false);

  const [leftover, setLeftover] = useState([]);
  const [leftoverLoading, setLeftoverLoading] = useState(false);

  const fetchPreorders = async () => {
    setPreordersLoading(true);
    const { data, error } = await supabase
      .from("preorders")
      .select(`
        id,
        quantity,
        order_date,
        products (
          type,
          variety,
          quality,
          base_price,
          description
        ),
        profiles (
          username
        )
      `)
      .eq("user_id", session.user.id)
      .order("order_date", { ascending: false });

    if (error) {
      toast.error("Error fetching preorders: " + error.message);
    } else {
      setPreorders(data);
    }
    setPreordersLoading(false);
  };

  const fetchLeftoverStock = async () => {
    setLeftoverLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        type,
        variety,
        quality,
        max_quantity,
        remaining_stock,
        base_price,
        description,
        profiles (
          username
        )
      `)
      .eq("available_date", reportDate)
      .gt("remaining_stock", 0);

    if (error) {
      toast.error("Error fetching leftover stock: " + error.message);
    } else {
      data.forEach((product) => {
        product.computed_name = computeProductName(product.type, product.variety, product.quality);
      });
      setLeftover(data);
    }
    setLeftoverLoading(false);
  };

  useEffect(() => {
    if (reportTab === "preorders") {
      fetchPreorders();
    } else if (reportTab === "leftover") {
      fetchLeftoverStock();
    }
  }, [reportDate, reportTab]);

  const sortedPreorders = [...preorders].sort((a, b) => {
    let valA, valB;
    switch (preordersSortColumn) {
      case "product":
        valA = computeProductName(a.products.type, a.products.variety, a.products.quality).toLowerCase();
        valB = computeProductName(b.products.type, b.products.variety, b.products.quality).toLowerCase();
        break;
      case "username":
        valA = a.profiles?.username?.toLowerCase() || "";
        valB = b.profiles?.username?.toLowerCase() || "";
        break;
      default:
        valA = a[preordersSortColumn];
        valB = b[preordersSortColumn];
        if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
    }
    if (valA < valB) return preordersSortDirection === "asc" ? -1 : 1;
    if (valA > valB) return preordersSortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const sortedLeftover = [...leftover].sort((a, b) => {
    let valA, valB;
    switch (leftoverSortColumn) {
      case "name":
        valA = a.computed_name.toLowerCase();
        valB = b.computed_name.toLowerCase();
        break;
      case "username":
        valA = a.profiles?.username?.toLowerCase() || "";
        valB = b.profiles?.username?.toLowerCase() || "";
        break;
      default:
        valA = a[leftoverSortColumn];
        valB = b[leftoverSortColumn];
        if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
    }
    if (valA < valB) return leftoverSortDirection === "asc" ? -1 : 1;
    if (valA > valB) return leftoverSortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handlePreordersSort = (column) => {
    if (preordersSortColumn === column) {
      setPreordersSortDirection(preordersSortDirection === "asc" ? "desc" : "asc");
    } else {
      setPreordersSortColumn(column);
      setPreordersSortDirection("asc");
    }
  };

  const handleLeftoverSort = (column) => {
    if (leftoverSortColumn === column) {
      setLeftoverSortDirection(leftoverSortDirection === "asc" ? "desc" : "asc");
    } else {
      setLeftoverSortColumn(column);
      setLeftoverSortDirection("asc");
    }
  };
  // send email
  const sendEmailReport = async () => {
    
    try {
      const reportData = reportTab === "preorders" ? preorders : leftover;
      console.log(reportTab)
      console.log(reportData)
      console.log(reportDate)
      const response = await fetch("http://localhost:5000/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: reportTab, reportDate, data: reportData }),
      });
  
      const result = await response.json();
      if (response.ok) {
        toast.success("Email sent successfully!");
      } else {
        toast.error("Failed to send email: " + result.message);
      }
    } catch (error) {
      toast.error("Error sending email");
    }
  };
  
  
 

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Reports</h2>
      <div className="mb-4 flex flex-wrap whitespace-nowrap items-center justify-between gap-4 shadow-md rounded-lg bg-white p-4">
        <div className="flex flex-wrap md:gap-0 gap-4 space-x-4">
          <button
            onClick={() => setReportTab("preorders")}
            className={`px-4 py-2 rounded ${reportTab === "preorders" ? "bg-indigo-600 text-white" : "bg-accent text-gray-700"}`}
          >
            Completed Preorders
          </button>
          <button
            onClick={() => setReportTab("leftover")}
            className={`px-4 py-2 rounded ${reportTab === "leftover" ? "bg-indigo-600 text-white" : "bg-accent text-gray-700"}`}
          >
            Leftover Stock
          </button>
        </div>
        <div className="flex  items-center flex-wrap gap-4">
          <div>
            <label className="mr-2 text-sm">Report Date:</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="border border-gray-300 rounded p-1"
            />
          </div>
          <button
         onClick={() => downloadPDF(reportTab, reportDate, reportTab === "preorders" ? preorders : leftover)}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Export as PDF
          </button>
          <button onClick={sendEmailReport} className="px-4 py-2 bg-blue-600 text-white rounded">
  Send Email Report
</button>
        </div>
      </div>

      {reportTab === "preorders" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <h2 className="text-sm md:text-xl font-semibold text-gray-700 mb-4">
            Completed Preorders on <b>{reportDate}</b>
          </h2>
          {preordersLoading ? (
            <p>Loading preorders...</p>
          ) : sortedPreorders.length === 0 ? (
            <p className="text-gray-500">No completed preorders for this day.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg bg-white" id="reportAreaPreorders">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handlePreordersSort("id")}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-600 uppercase"
                    >
                      Order ID <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                    </th>
                    <th
                      onClick={() => handlePreordersSort("username")}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-600 uppercase"
                    >
                      Username <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                    </th>
                    <th
                      onClick={() => handlePreordersSort("product")}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-600 uppercase"
                    >
                      Product <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                    </th>
                    <th
                      onClick={() => handlePreordersSort("quantity")}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-600 uppercase"
                    >
                      Quantity <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                    </th>
                    <th
                      onClick={() => handlePreordersSort("base_price")}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-600 uppercase"
                    >
                      Base Price <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                    </th>
                    <th
                      onClick={() => handlePreordersSort("total")}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-600 uppercase"
                    >
                      Total <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                    </th>
                    <th
                      onClick={() => handlePreordersSort("order_date")}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-600 uppercase"
                    >
                      Order Date <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedPreorders.map((order) => {
                    const productName = computeProductName(
                      order.products.type,
                      order.products.variety,
                      order.products.quality
                    );
                    const total = order.quantity * order.products.base_price;
                    const username = order.profiles?.username || "-";
                    return (
                      <tr key={order.id}>
                        <td className="px-4 py-2 text-sm">{order.id}</td>
                        <td className="px-4 py-2 text-sm">{username}</td>
                        <td className="px-4 py-2 text-sm">{productName}</td>
                        <td className="px-4 py-2 text-sm">{order.quantity}</td>
                        <td className="px-4 py-2 text-sm">
                          ${parseFloat(order.products.base_price).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          ${total.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {new Date(order.order_date).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {reportTab === "leftover" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Leftover Stock on <b>{reportDate}</b>
          </h2>
          {leftoverLoading ? (
            <p>Loading leftover stock...</p>
          ) : leftover.length === 0 ? (
            <p className="text-gray-500">No leftover stock for this day.</p>
          ) : (
            <div className="overflow-x-auto shadow-md rounded-lg bg-white" id="reportAreaLeftover">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleLeftoverSort("username")}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-600 uppercase tracking-wider"
                    >
                      Username <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                    </th>
                    <th
                      onClick={() => handleLeftoverSort("name")}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-600 uppercase tracking-wider"
                    >
                      Product <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                    </th>
                    <th
                      onClick={() => handleLeftoverSort("max_quantity")}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-600 uppercase tracking-wider"
                    >
                      Max Quantity <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                    </th>
                    <th
                      onClick={() => handleLeftoverSort("remaining_stock")}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-600 uppercase tracking-wider"
                    >
                      Remaining Stock <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                    </th>
                    <th
                      onClick={() => handleLeftoverSort("base_price")}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-600 uppercase tracking-wider"
                    >
                      Base Price <ArrowUpDown className="inline-block ml-1 h-4 w-4" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedLeftover.map((product) => {
                    const productName = computeProductName(
                      product.type,
                      product.variety,
                      product.quality
                    );
                    const username = product.profiles?.username || "-";
                    return (
                      <tr key={product.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{username}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{productName}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.max_quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.remaining_stock}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          ${parseFloat(product.base_price).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Reports;