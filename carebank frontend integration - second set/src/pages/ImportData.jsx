
// import { useRef, useState } from "react";
// import Papa from "papaparse";
// import { UploadCloud, FileText, CheckCircle2, XCircle, Trash2, Filter, ArrowUpDown } from "lucide-react";
// import Panel from "../components/Panel";
// import JarvisCore from "../components/JarvisCore";
// import { useData } from "../context/DataContext";

// const SAMPLE_CSV = `date,description,category,amount,status
// 2026-06-01,Client payment - Nimbus Co,Revenue,4200,success
// 2026-06-03,AWS hosting,Infrastructure,-312.5,success
// 2026-06-05,Office supplies,Operations,-89.2,success
// 2026-06-10,Client payment - Halo Ltd,Revenue,2600,success
// 2026-06-14,Payroll,Payroll,-6100,success
// 2026-06-18,Ad spend - Meta,Marketing,-540,success
// 2026-06-20,Refund - Client XYZ,Revenue,1500,success
// 2026-06-22,Server upgrade,Infrastructure,-2500,failed
// 2026-06-25,Consulting fee,Revenue,3500,success
// 2026-06-28,Software license,Operations,-799,pending
// 2026-07-01,Client payment - TechCorp,Revenue,5800,success
// 2026-07-03,Cloud storage,Infrastructure,-450,failed
// 2026-07-05,Marketing campaign,Marketing,-1200,success
// 2026-07-08,Legal fees,Operations,-800,pending
// 2026-07-10,Investment income,Revenue,1200,success
// 2026-07-12,Maintenance costs,Operations,-350,failed
// `;

// export default function ImportData() {
//   const { transactions, importTransactions, clearTransactions } = useData();
//   const [dragOver, setDragOver] = useState(false);
//   const [status, setStatus] = useState("idle");
//   const [errorMsg, setErrorMsg] = useState("");
//   const [fileName, setFileName] = useState("");
//   const [filterType, setFilterType] = useState("all"); // all | credited | debited | failed | pending
//   const [showFilterDropdown, setShowFilterDropdown] = useState(false);
//   const inputRef = useRef(null);

//   const mood = status === "parsing" ? "thinking" : status === "success" ? "happy" : status === "error" ? "concerned" : "idle";

//   function handleFiles(files) {
//     const file = files[0];
//     if (!file) return;
//     if (!file.name.toLowerCase().endsWith(".csv")) {
//       setStatus("error");
//       setErrorMsg("Only .csv files are supported.");
//       return;
//     }
//     setFileName(file.name);
//     setStatus("parsing");
//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       complete: (results) => {
//         const rows = results.data
//           .filter((r) => r.date && r.amount)
//           .map((r, i) => ({
//             id: i,
//             date: r.date,
//             description: r.description || "Untitled",
//             category: r.category || "Other",
//             amount: parseFloat(r.amount) || 0,
//             status: r.status || (parseFloat(r.amount) >= 0 ? "success" : "success"), // Default status
//           }));
//         if (rows.length === 0) {
//           setStatus("error");
//           setErrorMsg("No valid rows found. Expect columns: date, description, category, amount, status.");
//           return;
//         }
//         importTransactions(rows);
//         setStatus("success");
//       },
//       error: (err) => {
//         setStatus("error");
//         setErrorMsg(err.message || "Could not parse file.");
//       },
//     });
//   }

//   function downloadSample() {
//     const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "vega-sample-transactions.csv";
//     a.click();
//     URL.revokeObjectURL(url);
//   }

//   // Get filtered transactions
//   const getFilteredTransactions = () => {
//     switch (filterType) {
//       case "credited":
//         return transactions.filter(t => t.amount > 0);
//       case "debited":
//         return transactions.filter(t => t.amount < 0);
//       case "failed":
//         return transactions.filter(t => t.status === "failed");
//       case "pending":
//         return transactions.filter(t => t.status === "pending");
//       case "all":
//       default:
//         return transactions;
//     }
//   };

//   const filteredTransactions = getFilteredTransactions();

//   // Get counts for each filter
//   const getCounts = () => {
//     const total = transactions.length;
//     const credited = transactions.filter(t => t.amount > 0).length;
//     const debited = transactions.filter(t => t.amount < 0).length;
//     const failed = transactions.filter(t => t.status === "failed").length;
//     const pending = transactions.filter(t => t.status === "pending").length;
//     return { total, credited, debited, failed, pending };
//   };

//   const counts = getCounts();

//   const filterOptions = [
//     { value: "all", label: "All Transactions", icon: "📊" },
//     { value: "credited", label: "Credited (Income)", icon: "💰" },
//     { value: "debited", label: "Debited (Expenses)", icon: "💳" },
//     { value: "failed", label: "Failed", icon: "❌" },
//     { value: "pending", label: "Pending", icon: "⏳" },
//   ];

//   return (
//     <div className="p-8 max-w-6xl mx-auto">
//       <div className="flex items-start justify-between align-center mt-10 gap-6">
//         <div>
//           <p className="text-lg tracking-[0.25em] text-amber-500/80 font-mono uppercase mb-8">
//             Data intake
//           </p>
//           <h1 className="font-display text-3xl text-bone">Import transactions</h1>
//           <p className="text-bone/50 text-sm mt-10 max-w-md">
//             Upload a CSV of transactions and VEGA will structure it for the overview
//             dashboard and AI console.
//           </p>
//         </div>
//         <JarvisCore mood={mood} className="size-[110px] pt-[-100px]" />
//       </div>

//       <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
//         <Panel
//           className="p-8 flex flex-col mt-[-220px] mb-10 items-center justify-center text-center min-h-[280px]"
//           label="Upload"
//         >
//           <div
//             onDragOver={(e) => {
//               e.preventDefault();
//               setDragOver(true);
//             }}
//             onDragLeave={() => setDragOver(false)}
//             onDrop={(e) => {
//               e.preventDefault();
//               setDragOver(false);
//               handleFiles(e.dataTransfer.files);
//             }}
//             className={`w-full border-2 border-dashed rounded-lg py-24 px-6 transition-colors cursor-pointer ${
//               dragOver ? "border-amber-500 bg-amber-500/5" : "border-void-600 hover:border-void-500"
//             }`}
//             onClick={() => inputRef.current?.click()}
//           >
//             <input
//               ref={inputRef}
//               type="file"
//               accept=".csv"
//               className="hidden"
//               onChange={(e) => handleFiles(e.target.files)}
//             />
//             <UploadCloud className="mx-auto mb-4 text-amber-500/70" size={34} strokeWidth={1.5} />
//             <p className="text-bone/70 text-sm mb-1">
//               Drag a CSV here, or <span className="text-amber-400">browse</span>
//             </p>
//             <p className="text-bone/30 text-xs font-mono">date, description, category, amount, status</p>
//           </div>

//           {status === "parsing" && (
//             <p className="text-amber-400 text-xs font-mono mt-4 animate-pulseSoft">
//               PARSING {fileName}…
//             </p>
//           )}
//           {status === "success" && (
//             <p className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono mt-4">
//               <CheckCircle2 size={14} /> {transactions.length} rows imported from {fileName}
//             </p>
//           )}
//           {status === "error" && (
//             <p className="flex items-center gap-1.5 text-ember-500 text-xs font-mono mt-4">
//               <XCircle size={14} /> {errorMsg}
//             </p>
//           )}

//           <button
//             onClick={downloadSample}
//             className="mt-6 text-xs text-bone/40 hover:text-amber-400 font-mono underline underline-offset-4"
//           >
//             Download sample CSV
//           </button>
//         </Panel>

//         <Panel className="p-6" label="Status">
//           <div className="flex items-center gap-2 mb-4 text-bone/70 text-sm">
//             <FileText size={15} /> {transactions.length} records in workspace
//           </div>
          
//           {/* Status summary cards */}
//           <div className="grid grid-cols-2 gap-2 mb-4">
//             <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
//               <p className="text-emerald-400 text-lg font-mono">{counts.credited}</p>
//               <p className="text-bone/40 text-xs">Credited</p>
//             </div>
//             <div className="bg-ember-500/10 border border-ember-500/20 rounded-lg p-2 text-center">
//               <p className="text-ember-400 text-lg font-mono">{counts.debited}</p>
//               <p className="text-bone/40 text-xs">Debited</p>
//             </div>
//             <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
//               <p className="text-red-400 text-lg font-mono">{counts.failed}</p>
//               <p className="text-bone/40 text-xs">Failed</p>
//             </div>
//             <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
//               <p className="text-yellow-400 text-lg font-mono">{counts.pending}</p>
//               <p className="text-bone/40 text-xs">Pending</p>
//             </div>
//           </div>

//           <ul className="space-y-2 text-xs font-mono text-bone/40 mb-6">
//             <li>• Required columns: date, amount</li>
//             <li>• Optional: description, category, status</li>
//             <li>• Negative amounts are treated as expenses</li>
//             <li>• Status: success, failed, pending</li>
//             <li>• Re-importing replaces the current dataset</li>
//           </ul>
//           {transactions.length > 0 && (
//             <button
//               onClick={() => {
//                 clearTransactions();
//                 setStatus("idle");
//                 setFileName("");
//                 setFilterType("all");
//               }}
//               className="flex items-center gap-2 text-xs text-ember-500/80 hover:text-ember-500 font-mono"
//             >
//               <Trash2 size={13} /> Clear dataset
//             </button>
//           )}
//         </Panel>
//       </div>

//       {transactions.length > 0 && (
//         <Panel className="mt-6 overflow-hidden" label="Preview">
//           {/* Filter Bar */}
//           <div className="flex items-center justify-between px-5 py-3 border-b border-void-700/60">
//             <div className="flex items-center gap-2">
//               <Filter size={16} className="text-bone/40" />
//               <span className="text-xs text-bone/40 font-mono">Filter:</span>
//               <div className="relative">
//                 <button
//                   onClick={() => setShowFilterDropdown(!showFilterDropdown)}
//                   className="flex items-center gap-2 px-3 py-1.5 text-xs bg-void-800 hover:bg-void-700 text-bone rounded-md border border-void-600 transition-colors"
//                 >
//                   {filterOptions.find(f => f.value === filterType)?.icon}
//                   {filterOptions.find(f => f.value === filterType)?.label}
//                   <ArrowUpDown size={12} />
//                 </button>
                
//                 {showFilterDropdown && (
//                   <div className="absolute top-full left-0 mt-1 bg-void-800 border border-void-600 rounded-md shadow-lg z-10 min-w-[180px]">
//                     {filterOptions.map((option) => (
//                       <button
//                         key={option.value}
//                         onClick={() => {
//                           setFilterType(option.value);
//                           setShowFilterDropdown(false);
//                         }}
//                         className={`w-full text-left px-4 py-2 text-xs hover:bg-void-700 transition-colors flex items-center gap-2 ${
//                           filterType === option.value ? 'text-amber-400 bg-void-700' : 'text-bone/70'
//                         }`}
//                       >
//                         {option.icon} {option.label}
//                         <span className="ml-auto text-bone/30">
//                           {option.value === 'all' ? counts.total : 
//                            option.value === 'credited' ? counts.credited :
//                            option.value === 'debited' ? counts.debited :
//                            option.value === 'failed' ? counts.failed :
//                            counts.pending}
//                         </span>
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//             <span className="text-xs text-bone/30 font-mono">
//               Showing {filteredTransactions.length} of {transactions.length}
//             </span>
//           </div>

//           <div className="max-h-80 overflow-y-auto">
//             <table className="w-full text-sm">
//               <thead className="sticky top-0 bg-void-850">
//                 <tr className="text-left text-bone/40 text-xs font-mono uppercase">
//                   <th className="px-5 py-3">Date</th>
//                   <th className="px-5 py-3">Description</th>
//                   <th className="px-5 py-3">Category</th>
//                   <th className="px-5 py-3 text-right">Amount</th>
//                   <th className="px-5 py-3 text-center">Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredTransactions.map((t) => {
//                   const isCredited = t.amount > 0;
//                   const isFailed = t.status === "failed";
//                   const isPending = t.status === "pending";
                  
//                   let statusColor = "text-emerald-400";
//                   let statusIcon = "✓";
//                   let statusLabel = "Success";
                  
//                   if (isFailed) {
//                     statusColor = "text-red-400";
//                     statusIcon = "✗";
//                     statusLabel = "Failed";
//                   } else if (isPending) {
//                     statusColor = "text-yellow-400";
//                     statusIcon = "⏳";
//                     statusLabel = "Pending";
//                   } else if (isCredited) {
//                     statusColor = "text-emerald-400";
//                     statusIcon = "✓";
//                     statusLabel = "Success";
//                   } else {
//                     statusColor = "text-ember-400";
//                     statusIcon = "✓";
//                     statusLabel = "Success";
//                   }

//                   return (
//                     <tr key={t.id} className="border-t border-void-700/60 hover:bg-void-800/30 transition-colors">
//                       <td className="px-5 py-2.5 text-bone/60 font-mono text-xs">{t.date}</td>
//                       <td className="px-5 py-2.5 text-bone/80">{t.description}</td>
//                       <td className="px-5 py-2.5 text-bone/50 text-xs">{t.category}</td>
//                       <td
//                         className={`px-5 py-2.5 text-right font-mono text-xs ${
//                           isCredited ? "text-emerald-400" : "text-ember-500"
//                         }`}
//                       >
//                         {isCredited ? "+" : "-"}${Math.abs(t.amount).toLocaleString()}
//                       </td>
//                       <td className={`px-5 py-2.5 text-center text-xs font-mono ${statusColor}`}>
//                         {statusIcon} {statusLabel}
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </Panel>
//       )}
//     </div>
//   );
// }


import { useRef, useState, useEffect } from "react";
import Papa from "papaparse";
import { UploadCloud, FileText, CheckCircle2, XCircle, Trash2, Filter, ArrowUpDown, Loader2 } from "lucide-react";
import Panel from "../components/Panel";
import JarvisCore from "../components/JarvisCore";
import { useData } from "../context/DataContext";

// Get API URL from environment or use default
const API_URL = import.meta.env?.VITE_API_BASE_URL || 
                // process.env?.REACT_APP_API_URL || 
                'http://localhost:5000/api';

const SAMPLE_CSV = `date,description,category,amount,status
2026-06-01,Client payment - Nimbus Co,Revenue,4200,success
2026-06-03,AWS hosting,Infrastructure,-312.5,success
2026-06-05,Office supplies,Operations,-89.2,success
2026-06-10,Client payment - Halo Ltd,Revenue,2600,success
2026-06-14,Payroll,Payroll,-6100,success
2026-06-18,Ad spend - Meta,Marketing,-540,success
2026-06-20,Refund - Client XYZ,Revenue,1500,success
2026-06-22,Server upgrade,Infrastructure,-2500,failed
2026-06-25,Consulting fee,Revenue,3500,success
2026-06-28,Software license,Operations,-799,pending
2026-07-01,Client payment - TechCorp,Revenue,5800,success
2026-07-03,Cloud storage,Infrastructure,-450,failed
2026-07-05,Marketing campaign,Marketing,-1200,success
2026-07-08,Legal fees,Operations,-800,pending
2026-07-10,Investment income,Revenue,1200,success
2026-07-12,Maintenance costs,Operations,-350,failed
`;

export default function ImportData() {
  const { transactions, importTransactions, clearTransactions, token, user, logout } = useData();
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const inputRef = useRef(null);

  const mood = status === "parsing" ? "thinking" : status === "success" ? "happy" : status === "error" ? "concerned" : "idle";

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    // Try multiple ways to get the token
    let authToken = token;
    
    // If token is not in context, try localStorage
    if (!authToken) {
      authToken = localStorage.getItem('token') || localStorage.getItem('authToken');
    }
    
    // If still no token, try to get from user object
    if (!authToken && user?.token) {
      authToken = user.token;
    }
    
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('authToken') || user?.token;
    return !!authToken;
  };

  // Load user's uploaded files on mount
  useEffect(() => {
    if (isAuthenticated()) {
      loadUserFiles();
    }
  }, [token, user]);

  // Load user's uploaded files
  async function loadUserFiles() {
    try {
      const headers = getAuthHeaders();
      
      if (!headers['Authorization'] || headers['Authorization'] === 'Bearer null' || headers['Authorization'] === 'Bearer undefined') {
        console.warn('No valid token found for loading files');
        return;
      }

      const response = await fetch(`${API_URL}/files/files`, {
        headers: headers
      });
      
      if (response.status === 401) {
        console.error('Authentication failed - token may be expired');
        // Optionally logout or refresh token
        // logout();
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.files) {
        setUploadedFiles(data.files);
      }
    } catch (error) {
      console.error('Load files error:', error);
    }
  }

  // Upload file to server
  async function uploadFileToServer(file) {
    const formData = new FormData();
    formData.append('csvFile', file);
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Get auth token
    let authToken = token || localStorage.getItem('token') || localStorage.getItem('authToken') || user?.token;
    
    if (!authToken) {
      setStatus("error");
      setErrorMsg("Please log in to upload files");
      setIsUploading(false);
      return;
    }
    
    try {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      });
      
      // Handle response
      const response = await new Promise((resolve, reject) => {
        xhr.open('POST', `${API_URL}/files/upload`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        
        xhr.onload = () => {
          // Handle 401 specifically
          if (xhr.status === 401) {
            reject(new Error('Authentication failed. Please log in again.'));
            return;
          }
          
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (e) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || errorData.error || `Upload failed with status ${xhr.status}`));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error - please check your connection'));
        };
        
        xhr.send(formData);
      });
      
      if (response.success) {
        // Add transactions to state
        if (response.transactions && response.transactions.length > 0) {
          importTransactions(response.transactions);
        }
        
        setStatus("success");
        setIsUploading(false);
        
        // Refresh file list
        await loadUserFiles();
        
        // Trigger AI analysis if fileId is returned
        if (response.fileId) {
          await analyzeCSV(response.fileId);
        }
        
        return response;
      } else {
        throw new Error(response.message || 'Upload failed');
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setStatus("error");
      setErrorMsg(error.message || 'Failed to upload file. Please try again.');
      setIsUploading(false);
      
      // If authentication error, maybe logout
      if (error.message.includes('Authentication failed')) {
        // logout();
      }
      
      throw error;
    }
  }

  // Analyze CSV with AI
  async function analyzeCSV(fileId) {
    try {
      const headers = getAuthHeaders();
      
      if (!headers['Authorization'] || headers['Authorization'] === 'Bearer null' || headers['Authorization'] === 'Bearer undefined') {
        console.warn('No valid token for AI analysis');
        return;
      }

      const response = await fetch(`${API_URL}/ai/analyze/${fileId}`, {
        headers: headers
      });
      
      if (response.status === 401) {
        console.error('Authentication failed for AI analysis');
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.analysis) {
        console.log('AI Analysis:', data.analysis.response);
        // If you have a chat context, you can add this message there
        // For example: addChatMessage('agent', data.analysis.response);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
  }

  function handleFiles(files) {
    // Check authentication first
    if (!isAuthenticated()) {
      setStatus("error");
      setErrorMsg("Please log in to upload files");
      return;
    }
    
    const file = files[0];
    if (!file) return;
    
    // Validate file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'csv' && file.type !== 'text/csv') {
      setStatus("error");
      setErrorMsg("Only CSV files are supported.");
      return;
    }
    
    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setStatus("error");
      setErrorMsg("File size exceeds 50MB limit.");
      return;
    }
    
    setFileName(file.name);
    setStatus("parsing");
    setErrorMsg("");
    
    // Parse CSV locally first for preview
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data
          .filter((r) => r.date && r.amount)
          .map((r, i) => ({
            id: i,
            date: r.date,
            description: r.description || "Untitled",
            category: r.category || "Other",
            amount: parseFloat(r.amount) || 0,
            status: r.status || (parseFloat(r.amount) >= 0 ? "success" : "success"),
          }));
        
        if (rows.length === 0) {
          setStatus("error");
          setErrorMsg("No valid rows found. Expect columns: date, description, category, amount, status.");
          return;
        }
        
        // Upload to server
        uploadFileToServer(file)
          .then(() => {
            // Success handled in upload function
          })
          .catch((err) => {
            // Error handled in upload function
          });
      },
      error: (err) => {
        setStatus("error");
        setErrorMsg(err.message || "Could not parse file.");
      },
    });
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vega-sample-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Get filtered transactions
  const getFilteredTransactions = () => {
    switch (filterType) {
      case "credited":
        return transactions.filter(t => t.amount > 0);
      case "debited":
        return transactions.filter(t => t.amount < 0);
      case "failed":
        return transactions.filter(t => t.status === "failed");
      case "pending":
        return transactions.filter(t => t.status === "pending");
      case "all":
      default:
        return transactions;
    }
  };

  const filteredTransactions = getFilteredTransactions();

  // Get counts for each filter
  const getCounts = () => {
    const total = transactions.length;
    const credited = transactions.filter(t => t.amount > 0).length;
    const debited = transactions.filter(t => t.amount < 0).length;
    const failed = transactions.filter(t => t.status === "failed").length;
    const pending = transactions.filter(t => t.status === "pending").length;
    return { total, credited, debited, failed, pending };
  };

  const counts = getCounts();

  const filterOptions = [
    { value: "all", label: "All Transactions", icon: "📊" },
    { value: "credited", label: "Credited (Income)", icon: "💰" },
    { value: "debited", label: "Debited (Expenses)", icon: "💳" },
    { value: "failed", label: "Failed", icon: "❌" },
    { value: "pending", label: "Pending", icon: "⏳" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between align-center mt-10 gap-6">
        <div>
          <p className="text-lg tracking-[0.25em] text-amber-500/80 font-mono uppercase mb-8">
            Data intake
          </p>
          <h1 className="font-display text-3xl text-bone">Import transactions</h1>
          <p className="text-bone/50 text-sm mt-10 max-w-md">
            Upload a CSV of transactions and VEGA will structure it for the overview
            dashboard and AI console.
          </p>
        </div>
        <JarvisCore mood={mood} className="size-[110px] pt-[-100px]" />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <Panel
          className="p-8 flex flex-col mt-[-220px] mb-10 items-center justify-center text-center min-h-[280px]"
          label="Upload"
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`w-full border-2 border-dashed rounded-lg py-24 px-6 transition-colors cursor-pointer ${
              dragOver ? "border-amber-500 bg-amber-500/5" : "border-void-600 hover:border-void-500"
            }`}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <UploadCloud className="mx-auto mb-4 text-amber-500/70" size={34} strokeWidth={1.5} />
            <p className="text-bone/70 text-sm mb-1">
              Drag a CSV here, or <span className="text-amber-400">browse</span>
            </p>
            <p className="text-bone/30 text-xs font-mono">date, description, category, amount, status</p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="w-full mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-bone/60 font-mono">Uploading...</span>
                <span className="text-xs text-bone/60 font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-void-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {status === "parsing" && !isUploading && (
            <p className="text-amber-400 text-xs font-mono mt-4 animate-pulseSoft">
              PARSING {fileName}…
            </p>
          )}
          {status === "success" && (
            <p className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono mt-4">
              <CheckCircle2 size={14} /> {transactions.length} rows imported from {fileName}
            </p>
          )}
          {status === "error" && (
            <p className="flex items-center gap-1.5 text-ember-500 text-xs font-mono mt-4">
              <XCircle size={14} /> {errorMsg}
            </p>
          )}

          <button
            onClick={downloadSample}
            className="mt-6 text-xs text-bone/40 hover:text-amber-400 font-mono underline underline-offset-4"
          >
            Download sample CSV
          </button>
        </Panel>

        <Panel className="p-6" label="Status">
          <div className="flex items-center gap-2 mb-4 text-bone/70 text-sm">
            <FileText size={15} /> {transactions.length} records in workspace
          </div>
          
          {/* Status summary cards */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
              <p className="text-emerald-400 text-lg font-mono">{counts.credited}</p>
              <p className="text-bone/40 text-xs">Credited</p>
            </div>
            <div className="bg-ember-500/10 border border-ember-500/20 rounded-lg p-2 text-center">
              <p className="text-ember-400 text-lg font-mono">{counts.debited}</p>
              <p className="text-bone/40 text-xs">Debited</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
              <p className="text-red-400 text-lg font-mono">{counts.failed}</p>
              <p className="text-bone/40 text-xs">Failed</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
              <p className="text-yellow-400 text-lg font-mono">{counts.pending}</p>
              <p className="text-bone/40 text-xs">Pending</p>
            </div>
          </div>

          <ul className="space-y-2 text-xs font-mono text-bone/40 mb-6">
            <li>• Required columns: date, amount</li>
            <li>• Optional: description, category, status</li>
            <li>• Negative amounts are treated as expenses</li>
            <li>• Status: success, failed, pending</li>
            <li>• File size limit: 50MB</li>
            <li>• Re-importing replaces the current dataset</li>
          </ul>
          {transactions.length > 0 && (
            <button
              onClick={() => {
                clearTransactions();
                setStatus("idle");
                setFileName("");
                setFilterType("all");
                setUploadProgress(0);
                setIsUploading(false);
              }}
              className="flex items-center gap-2 text-xs text-ember-500/80 hover:text-ember-500 font-mono"
            >
              <Trash2 size={13} /> Clear dataset
            </button>
          )}
        </Panel>
      </div>

      {transactions.length > 0 && (
        <Panel className="mt-6 overflow-hidden" label="Preview">
          {/* Filter Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-void-700/60">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-bone/40" />
              <span className="text-xs text-bone/40 font-mono">Filter:</span>
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-void-800 hover:bg-void-700 text-bone rounded-md border border-void-600 transition-colors"
                >
                  {filterOptions.find(f => f.value === filterType)?.icon}
                  {filterOptions.find(f => f.value === filterType)?.label}
                  <ArrowUpDown size={12} />
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-void-800 border border-void-600 rounded-md shadow-lg z-10 min-w-[180px]">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterType(option.value);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-void-700 transition-colors flex items-center gap-2 ${
                          filterType === option.value ? 'text-amber-400 bg-void-700' : 'text-bone/70'
                        }`}
                      >
                        {option.icon} {option.label}
                        <span className="ml-auto text-bone/30">
                          {option.value === 'all' ? counts.total : 
                           option.value === 'credited' ? counts.credited :
                           option.value === 'debited' ? counts.debited :
                           option.value === 'failed' ? counts.failed :
                           counts.pending}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-bone/30 font-mono">
              Showing {filteredTransactions.length} of {transactions.length}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-void-850">
                <tr className="text-left text-bone/40 text-xs font-mono uppercase">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => {
                  const isCredited = t.amount > 0;
                  const isFailed = t.status === "failed";
                  const isPending = t.status === "pending";
                  
                  let statusColor = "text-emerald-400";
                  let statusIcon = "✓";
                  let statusLabel = "Success";
                  
                  if (isFailed) {
                    statusColor = "text-red-400";
                    statusIcon = "✗";
                    statusLabel = "Failed";
                  } else if (isPending) {
                    statusColor = "text-yellow-400";
                    statusIcon = "⏳";
                    statusLabel = "Pending";
                  } else if (isCredited) {
                    statusColor = "text-emerald-400";
                    statusIcon = "✓";
                    statusLabel = "Success";
                  } else {
                    statusColor = "text-ember-400";
                    statusIcon = "✓";
                    statusLabel = "Success";
                  }

                  return (
                    <tr key={t.id} className="border-t border-void-700/60 hover:bg-void-800/30 transition-colors">
                      <td className="px-5 py-2.5 text-bone/60 font-mono text-xs">{t.date}</td>
                      <td className="px-5 py-2.5 text-bone/80">{t.description}</td>
                      <td className="px-5 py-2.5 text-bone/50 text-xs">{t.category}</td>
                      <td
                        className={`px-5 py-2.5 text-right font-mono text-xs ${
                          isCredited ? "text-emerald-400" : "text-ember-500"
                        }`}
                      >
                        {isCredited ? "+" : "-"}${Math.abs(t.amount).toLocaleString()}
                      </td>
                      <td className={`px-5 py-2.5 text-center text-xs font-mono ${statusColor}`}>
                        {statusIcon} {statusLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}