import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  PaperClipIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  DocumentIcon
} from "@heroicons/react/24/outline";

// Mock Data for Design Review Detail
const mockDesignWork = {
  id: "DW-001",
  title: "Custom Figure Anime",
  status: "IN_PROGRESS",
  createdAt: "2026-01-15 08:30",
  customer: {
    id: "CUST-001",
    name: "Nguyễn Văn A",
    email: "an@email.com",
    avatar: null
  },
  orderItem: {
    id: "ITEM-001",
    productName: "Tượng Custom (Size M)",
    requirement: "Yêu cầu: Nhân vật nam, tóc xanh, cầm kiếm, pose đứng chiến đấu. Style chibi cute."
  },
  versions: [
    {
      version: 1,
      fileUrl: "/designs/figure_v1.jpg",
      fileName: "figure_v1.jpg",
      uploadedAt: "2026-01-16 09:00",
      note: "Bản sketch đầu tiên",
      status: "REJECTED",
      feedback: "Tóc chưa đủ xanh, cần xanh đậm hơn."
    },
    {
      version: 2,
      fileUrl: "/designs/figure_v2.jpg",
      fileName: "figure_v2.jpg",
      uploadedAt: "2026-01-17 14:00",
      note: "Đã chỉnh màu tóc theo feedback",
      status: "PENDING",
      feedback: null
    }
  ],
  messages: [
    {
      id: 1,
      sender: "CUSTOMER",
      content: "Chào shop, mình muốn đặt làm tượng này, nhưng tóc màu xanh dương nhé.",
      time: "2026-01-15 08:35"
    },
    {
      id: 2,
      sender: "STAFF",
      content: "Chào bạn, mình đã nhận yêu cầu. Mình sẽ lên bản sketch và gửi bạn xem trước.",
      time: "2026-01-15 09:00"
    },
    {
      id: 3,
      sender: "STAFF",
      content: "Gửi bạn bản v1 nhé. Bạn xem ổn chưa?",
      time: "2026-01-16 09:01",
      attachment: "figure_v1.jpg"
    },
    {
      id: 4,
      sender: "CUSTOMER",
      content: "Màu tóc hơi nhạt bạn ơi, cho đậm hơn xíu đi.",
      time: "2026-01-16 10:20"
    }
  ]
};

const StaffDesignReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [work, setWork] = useState(mockDesignWork);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;

    const msg = {
      id: work.messages.length + 1,
      sender: "STAFF",
      content: newMessage,
      time: new Date().toLocaleString(),
      attachment: file ? file.name : null
    };

    setWork(prev => ({
      ...prev,
      messages: [...prev.messages, msg]
    }));
    setNewMessage("");
    setFile(null);
  };

  const statusColors = {
    QUEUED: "bg-gray-100 text-gray-700",
    IN_PROGRESS: "bg-purple-100 text-purple-700",
    REVIEWING: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-green-100 text-green-700"
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/staff/design-reviews"
            className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 shadow-sm"
          >
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{work.title}</h1>
            <p className="text-gray-500 text-sm">Design Work #{work.id} • Item: {work.orderItem.id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className={`px-4 py-2 rounded-lg font-medium ${statusColors[work.status]}`}>
            Status: {work.status}
          </span>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm">
            Mark as Completed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">

        {/* Left Column: Info & Versions */}
        <div className="space-y-6 md:col-span-1 overflow-y-auto pr-2">
          {/* Requirement Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <DocumentIcon className="w-5 h-5 mr-2 text-blue-500" />
              Yêu cầu thiết kế
            </h3>
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              {work.orderItem.requirement}
            </div>
            <div className="mt-4 flex items-center gap-3 pt-3 border-t border-gray-100">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                {work.customer.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{work.customer.name}</p>
                <p className="text-xs text-gray-500">{work.customer.email}</p>
              </div>
            </div>
          </div>

          {/* Version History */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
              <span>Lịch sử phiên bản</span>
              <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded-full">{work.versions.length} versions</span>
            </h3>

            <div className="space-y-4">
              {work.versions.map((ver, idx) => (
                <div key={idx} className="relative pl-6 pb-4 border-l-2 border-gray-100 last:border-0 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500"></div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm text-gray-800">Version {ver.version}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ver.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {ver.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      <p>File: {ver.fileName}</p>
                      <p className="text-gray-400 mt-1">{ver.uploadedAt}</p>
                      {ver.note && <p className="italic mt-1">"{ver.note}"</p>}
                    </div>
                    {(ver.status === 'REJECTED' && ver.feedback) && (
                      <div className="bg-red-50 p-2 rounded text-xs text-red-700 border border-red-100 mt-2">
                        Feedback: "{ver.feedback}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Upload New Version Button */}
            <button className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
              <ArrowUpTrayIcon className="w-5 h-5" /> Upload New Version
            </button>
          </div>
        </div>

        {/* Right Column: Chat/Discussion */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5" /> Trao đổi với khách hàng
            </h3>
            <span className="text-xs text-green-600 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div> Online
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {work.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'STAFF' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${msg.sender === 'STAFF' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'} rounded-xl p-3 shadow-sm`}>
                  <p className="text-sm">{msg.content}</p>
                  {msg.attachment && (
                    <div className={`mt-2 p-2 rounded flex items-center gap-2 text-xs ${msg.sender === 'STAFF' ? 'bg-blue-700' : 'bg-white border border-gray-200'}`}>
                      <PaperClipIcon className="w-4 h-4" />
                      <span>{msg.attachment}</span>
                    </div>
                  )}
                  <p className={`text-[10px] mt-1 text-right ${msg.sender === 'STAFF' ? 'text-blue-200' : 'text-gray-400'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <button
                type="button"
                className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors relative"
                onClick={() => document.getElementById('file-upload').click()}
              >
                <PaperClipIcon className="w-6 h-6" />
                <input id="file-upload" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                {file && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>}
              </button>
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Gửi
              </button>
            </form>
            {file && (
              <div className="mt-2 text-xs text-gray-600 flex items-center justify-between bg-white px-3 py-1 rounded border border-gray-200 w-fit">
                <span>Selected: {file.name}</span>
                <button onClick={() => setFile(null)} className="ml-2 text-red-500 hover:text-red-700"><XCircleIcon className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StaffDesignReviewDetail;
