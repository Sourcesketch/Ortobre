import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  table: {
    display: "table",
    width: "100%",
    marginVertical: 10,
    border: "1px solid black",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid black",
    padding: 4,
  },
  tableHeader: {
    backgroundColor: "#E4E4E4",
    fontWeight: "bold",
  },
  tableCell: {
    flex: 1,
    padding: 4,
    fontSize: 10,
    textAlign: "left",
  },
});

const ReportPDF = ({ reportType, reportDate, data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{reportType === "preorders" ? "Completed Preorders Report" : "Leftover Stock Report"}</Text>
      <Text style={{ fontSize: 12, marginBottom: 10 }}>Report Date: {reportDate}</Text>

      {/* Table */}
      <View style={styles.table}>
        {/* Header Row */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          {reportType === "preorders" ? (
            <>
              <Text style={styles.tableCell}>Order ID</Text>
              <Text style={styles.tableCell}>Username</Text>
              <Text style={styles.tableCell}>Product</Text>
              <Text style={styles.tableCell}>Quantity</Text>
              <Text style={styles.tableCell}>Base Price</Text>
              <Text style={styles.tableCell}>Total</Text>
            </>
          ) : (
            <>
              <Text style={styles.tableCell}>Username</Text>
              <Text style={styles.tableCell}>Product</Text>
              <Text style={styles.tableCell}>Max Qty</Text>
              <Text style={styles.tableCell}>Remaining Stock</Text>
              <Text style={styles.tableCell}>Base Price</Text>
            </>
          )}
        </View>

        {/* Data Rows */}
        {data.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            {reportType === "preorders" ? (
              <>
                <Text style={styles.tableCell}>{item.id}</Text>
                <Text style={styles.tableCell}>{item.profiles?.username || "-"}</Text>
                <Text style={styles.tableCell}>
                  {item.products?.type} {item.products?.variety} {item.products?.quality}
                </Text>
                <Text style={styles.tableCell}>{item.quantity}</Text>
                <Text style={styles.tableCell}>${parseFloat(item.products?.base_price).toFixed(2)}</Text>
                <Text style={styles.tableCell}>${(item.quantity * item.products?.base_price).toFixed(2)}</Text>
              </>
            ) : (
              <>
                <Text style={styles.tableCell}>{item.profiles?.username || "-"}</Text>
                <Text style={styles.tableCell}>
                  {item.type} {item.variety} {item.quality}
                </Text>
                <Text style={styles.tableCell}>{item.max_quantity}</Text>
                <Text style={styles.tableCell}>{item.remaining_stock}</Text>
                <Text style={styles.tableCell}>${parseFloat(item.base_price).toFixed(2)}</Text>
              </>
            )}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default ReportPDF;
