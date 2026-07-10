import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { notification } from 'antd';
import { getOrderDetailApi } from '../api/orderApi';
import feedbackApi from '../api/feedbackApi';

const StarIcon = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth={1.5} className="w-9 h-9">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
);

const RATING_LABELS = {
  1: 'Rất không hài lòng',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất hài lòng',
};

const FeedbackForm = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const explicitOrderItemId = searchParams.get('orderItemId');
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(explicitOrderItemId || '');
  const [formData, setFormData] = useState({ rating: 5, comment: '' });
  const [hovered, setHovered] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getOrderDetailApi(orderId);
        const data = res?.data || res;
        const orderItems = data?.items || [];
        setItems(orderItems);
        if (!selectedItemId && orderItems.length > 0) {
          setSelectedItemId(orderItems[0].id);
        }
      } catch (err) {
        console.error(err);
        notification.error({ message: 'Không tải được đơn hàng' });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId) {
      notification.warning({ message: 'Vui lòng chọn sản phẩm cần đánh giá' });
      return;
    }
    setSubmitting(true);
    try {
      await feedbackApi.send({
        orderItemId: selectedItemId,
        rating: formData.rating,
        comment: formData.comment,
        imageUrls: [],
      });
      notification.success({ message: 'Cảm ơn bạn đã gửi đánh giá!' });
      navigate('/my-orders');
    } catch (err) {
      console.error(err);
      notification.error({
        message: 'Gửi đánh giá thất bại',
        description: err?.response?.data?.message || err?.response?.data?.data || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hovered || formData.rating;

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gửi đánh giá</h1>
        <p className="text-gray-500 mt-1">
          Mã đơn hàng: <span className="font-mono font-semibold text-gray-700">#{orderId}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Sản phẩm cần đánh giá
          </label>
          {loading ? (
            <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-rose-600">Đơn hàng không có sản phẩm hợp lệ để đánh giá.</p>
          ) : (
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.itemName || it.id} (x{it.quantityOrdered})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Đánh giá của bạn
          </label>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({ ...formData, rating: star })}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(null)}
                className={`transition-colors duration-100 cursor-pointer ${star <= displayRating ? 'text-amber-400' : 'text-gray-200'}`}
              >
                <StarIcon filled={star <= displayRating} />
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-indigo-600">{RATING_LABELS[displayRating]}</p>
        </div>

        <div>
          <label htmlFor="comment" className="block mb-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Nhận xét
          </label>
          <textarea
            id="comment"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            rows={5}
            required
            placeholder="Chia sẻ trải nghiệm của bạn về đơn hàng này..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
              submitting ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/my-orders')}
            className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-50"
          >
            Huỷ
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
