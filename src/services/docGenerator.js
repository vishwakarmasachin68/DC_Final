import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

const formatDateToReadable = (isoDate) => {
  if (!isoDate) return "N/A";
  try {
    const dateObj = new Date(isoDate);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
};

export const generateDoc = async (challan) => {
  try {
    // Load the template
    const response = await fetch("/templates/challan-template.docx");
    if (!response.ok) throw new Error("Failed to load Word template");

    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare data for the document with proper serial numbers
    const items = challan.items.map((item, index) => ({
      SLNo: item.sno || index + 1, // Use provided serial number or fallback to index
      asset: item.asset_name || "N/A",
      desc: item.description || "N/A",
      qty: item.quantity || 0,
      serial: item.serial_no || "N/A",
      return: item.returnable === "yes" ? "YES" : "NO",
      returnDate: item.returnable === "yes" 
        ? formatDateToReadable(item.expected_return_date) 
        : "N/A",
    }));

    // Set the template variables with fallbacks
    doc.setData({
      DCNO: challan.dc_number || "N/A",
      Date: formatDateToReadable(challan.date),
      Name: challan.name || "N/A",
      Project: challan.project_name || "N/A",
      Client: challan.client || "N/A",
      Location: challan.location || "N/A",
      PONumber: challan.po_number || "N/A",
      items: items,
      totalItems: items.length,
    });

    try {
      doc.render();
    } catch (error) {
      console.error("Template rendering error:", error);
      throw new Error("Failed to render document template");
    }

    // Generate the document
    const blob = doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Generate filename with current date
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()}-${currentDate.getMonth()+1}-${currentDate.getFullYear()}`;
    const filename = `Delivery_Challan_${(challan.dc_number || "DC").replace(/\//g, "_")}_${formattedDate}.docx`;

    // Save the document
    saveAs(blob, filename);

    return { success: true, filename };
  } catch (error) {
    console.error("Document generation error:", error);
    throw new Error(`Failed to generate document: ${error.message}`);
  }
};