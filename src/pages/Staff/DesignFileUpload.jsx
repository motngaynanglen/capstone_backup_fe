import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const DesignFileUpload = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    file: null,
    version: 1,
    isPreview: false,
    notes: ''
  });

  const handleChange = (e) => {
    if (e.target.name === 'file') {
      setFormData({ ...formData, file: e.target.files[0] });
    } else if (e.target.name === 'isPreview') {
      setFormData({ ...formData, isPreview: e.target.checked });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Upload file
    alert('File uploaded successfully!');
    navigate(`/staff/custom-orders/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Tải lên file thiết kế</h1>
        <p className="text-gray-600 mb-6">Đơn hàng #{orderId}</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-800">3D Design File</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-600 transition-colors">
            <input
              type="file"
              name="file"
              accept=".stl,.obj"
              onChange={handleChange}
              required
              className="hidden"
              id="design-file-upload"
            />
            <label htmlFor="design-file-upload" className="cursor-pointer">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-gray-600">
                {formData.file ? formData.file.name : 'Click to upload design file'}
              </p>
              <p className="text-sm text-gray-500 mt-2">STL, OBJ files only</p>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block mb-2 font-medium text-gray-800">Version Number</label>
            <input
              type="number"
              name="version"
              value={formData.version}
              onChange={handleChange}
              min="1"
              required
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-indigo-600"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isPreview"
                checked={formData.isPreview}
                onChange={handleChange}
                className="w-5 h-5"
              />
              <span className="font-medium text-gray-800">Mark as Ready for Preview</span>
            </label>
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-800">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-indigo-600"
            placeholder="Add notes about this version..."
          />
        </div>

        {formData.isPreview && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> When marked as "Ready for Preview", the customer will be notified via Zalo 
              and can review the design file.
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => navigate(`/staff/custom-orders/${orderId}`)}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
        </form>
      </div>
    </div>
  );
};

export default DesignFileUpload;

