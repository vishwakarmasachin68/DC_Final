import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

const formatDateToReadable = (isoDate) => {
  try {
    const dateObj = new Date(isoDate);
    return dateObj.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
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

    // Prepare data for the document
    const items = challan.items.map((item) => ({
      SLNo: item.sno,
      asset: item.asset_name || item.assetName,
      desc: item.description,
      qty: item.quantity,
      serial: item.serial_no || item.serialNo,
      return: item.returnable === "yes" ? "YES" : "NO",
      returnDate:
        item.returnable === "yes"
          ? formatDateToReadable(item.expected_return_date || item.expectedReturnDate)
          : "N/A",
    }));

    // Set the template variables
    doc.setData({
      DCNO: challan.dc_number || challan.dcNumber,
      Date: formatDateToReadable(challan.date),
      Name: challan.name,
      Project: challan.project_name || challan.projectName || "N/A",
      Client: challan.client,
      Location: challan.location,
      items: items,
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
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Save the document
    saveAs(
      blob,
      `Delivery_Challan_${(challan.dc_number || challan.dcNumber).replace(/\//g, "_")}.docx`
    );

    return { success: true };
  } catch (error) {
    console.error("Document generation error:", error);
    throw new Error(`Failed to generate document: ${error.message}`);
  }
};