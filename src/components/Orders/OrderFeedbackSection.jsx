import React, { useState } from 'react';
import { notification } from 'antd';
import feedbackApi from '../../api/feedbackApi';
import { canSubmitOrderFeedback } from '../../utils/orderNormalize';

const StarIcon = ({ filled, size = 'w-7 h-7' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth={1.5} className={size}>
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

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const StarsDisplay = ({ rating }) => (
  <div className="flex gap-0.5 text-amber-400">
    {[1, 2, 3, 4, 5].map((s) => (
      <StarIcon key={s} filled={s <= rating} size="w-4 h-4" />
    ))}
  </div>
);

const ItemFeedbackForm = ({ item, onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hovered, setHovered] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const displayRating = hovered || rating;
  const itemName = item.itemName || item.name || 'Sản phẩm';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const orderItemId = item.id ?? item.Id;
    if (!orderItemId) {
      notification.error({
        message: 'Không xác định được sản phẩm trong đơn',
        description: 'Vui lòng tải lại trang chi tiết đơn hàng.',
      });
      return;
    }
    if (!comment.trim()) {
      notification.warning({ message: 'Vui lòng nhập nhận xét' });
      return;
    }
    setSubmitting(true);
    try {
      await feedbackApi.send({
        orderItemId,
        rating,
        comment: comment.trim(),
        imageUrls: [],
      });
      notification.success({ message: 'Đã gửi đánh giá' });
      setComment('');
      onSubmitted?.();
    } catch (err) {
      const body = err?.response?.data;
      notification.error({
        message: 'Gửi đánh giá thất bại',
        description: body?.message || body?.data || err?.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">Đánh giá: {itemName}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            className={`cursor-pointer transition-colors ${star <= displayRating ? 'text-amber-400' : 'text-gray-300'}`}
          >
            <StarIcon filled={star <= displayRating} />
          </button>
        ))}
      </div>
      <p className="text-xs font-medium text-indigo-600">{RATING_LABELS[displayRating]}</p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Chia sẻ trải nghiệm của bạn..."
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 resize-none bg-white"
      />
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
      </button>
    </form>
  );
};

const OrderFeedbackSection = ({
  orderItems = [],
  orderStatus,
  shipmentStatus,
  completedAt,
  onRefresh,
}) => {
  const reviewable = canSubmitOrderFeedback(orderStatus, shipmentStatus, completedAt);
  const submitted = orderItems.filter((it) => it.feedback);
  const pending = orderItems.filter((it) => {
    if (it.feedback) return false;
    if (it.canSubmitFeedback === true) return true;
    if (it.canSubmitFeedback === false) return false;
    return reviewable;
  });

  if (!reviewable && submitted.length === 0) return null;

  return (
    <div id="order-feedback" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-6 bg-indigo-600 rounded-full" />
        <h2 className="text-lg font-bold text-gray-900">Đánh giá & nhận xét</h2>
      </div>

      <div className="space-y-4">
        {submitted.map((item) => {
          const fb = item.feedback;
          const itemName = item.itemName || item.name || 'Sản phẩm';
          return (
            <div key={item.id} className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{itemName}</p>
              <div className="space-y-2">
                <div className="inline-block max-w-full rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <StarsDisplay rating={fb.rating} />
                    <span className="text-xs text-gray-500">{formatDate(fb.created)}</span>
                  </div>
                  {fb.comment && <p className="text-sm text-gray-800 whitespace-pre-wrap m-0">{fb.comment}</p>}
                  {fb.imageUrls?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {fb.imageUrls.map((url) => (
                        <img key={url} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                      ))}
                    </div>
                  )}
                </div>

                {fb.staffReply?.trim() && (
                  <div className="flex items-start gap-2 pl-3 border-l-2 border-indigo-200">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                      3D
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-indigo-700 m-0 mb-0.5">Cửa hàng</p>
                      <div className="inline-block max-w-full rounded-2xl rounded-tl-sm bg-indigo-50 border border-indigo-100 px-3 py-2">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap m-0">{fb.staffReply}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {pending.length > 0 && (
          <div className="pt-2 border-t border-gray-100 space-y-4">
            {pending.map((item) => (
              <ItemFeedbackForm key={item.id} item={item} onSubmitted={onRefresh} />
            ))}
          </div>
        )}

        {reviewable && submitted.length === 0 && pending.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            Đơn hàng này chưa có mặt hàng nào hỗ trợ đánh giá.
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderFeedbackSection;
