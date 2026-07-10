import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import feedbackApi from '../../api/feedbackApi';
import { resolvePublicMediaUrl } from '../../utils/mediaUrl';

const StarIcon = ({ filled, size = 'w-4 h-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth={1.5} className={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
);

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

const normalizeFeedback = (fb) => ({
  id: fb.id ?? fb.Id,
  rating: fb.rating ?? fb.Rating ?? 0,
  comment: fb.comment ?? fb.Comment ?? '',
  staffReply: fb.staffReply ?? fb.StaffReply,
  customerFullName: fb.customerFullName ?? fb.CustomerFullName ?? 'Khách hàng',
  customerAvatar: fb.customerAvatar ?? fb.CustomerAvatar,
  created: fb.created ?? fb.Created,
  imageUrls: (fb.imageUrls ?? fb.ImageUrls ?? []).map((u) => resolvePublicMediaUrl(u) || u),
});

const StarsDisplay = ({ rating }) => (
  <div className="flex gap-0.5 text-amber-400">
    {[1, 2, 3, 4, 5].map((s) => (
      <StarIcon key={s} filled={s <= rating} />
    ))}
  </div>
);

const FeedbackCommentsList = ({ templateId, title = 'Đánh giá từ khách hàng' }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!templateId) return undefined;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await feedbackApi.byTemplate(templateId, { pageNumber: 1, pageSize: 50 });
        const raw = res?.data ?? res;
        const list = Array.isArray(raw) ? raw.map(normalizeFeedback) : [];
        if (!cancelled) setItems(list);
      } catch (err) {
        console.error('Load template feedback:', err);
        if (!cancelled) {
          setError('Không tải được đánh giá');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [templateId]);

  if (!templateId) return null;

  const avgRating = items.length
    ? (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(1)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-indigo-600 rounded-full" />
          <h2 className="text-lg font-bold text-gray-900 m-0">{title}</h2>
        </div>
        {avgRating && (
          <div className="flex items-center gap-2 text-sm">
            <StarsDisplay rating={Math.round(Number(avgRating))} />
            <span className="font-semibold text-gray-800">{avgRating}/5</span>
            <span className="text-gray-400">({items.length})</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-8 flex justify-center">
          <Spin />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 text-center py-4">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          Chưa có đánh giá nào. Mua và nhận hàng để trở thành người đánh giá đầu tiên!
        </p>
      ) : (
        <div className="space-y-5">
          {items.map((fb) => (
            <div key={fb.id} className="space-y-2">
              <div className="flex items-center gap-2">
                {fb.customerAvatar ? (
                  <img
                    src={resolvePublicMediaUrl(fb.customerAvatar) || fb.customerAvatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                    {(fb.customerFullName || 'K')[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900 m-0">{fb.customerFullName}</p>
                  <div className="flex items-center gap-2">
                    <StarsDisplay rating={fb.rating} />
                    <span className="text-xs text-gray-400">{formatDate(fb.created)}</span>
                  </div>
                </div>
              </div>

              <div className="pl-10 space-y-2">
                <div className="inline-block max-w-full rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
                  {fb.comment ? (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap m-0">{fb.comment}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic m-0">Không có nhận xét.</p>
                  )}
                  {fb.imageUrls?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {fb.imageUrls.map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        />
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
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackCommentsList;
