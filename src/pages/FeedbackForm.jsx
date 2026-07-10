import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

/** Chuyển hướng sang chi tiết đơn — đánh giá nằm inline tại #order-feedback */
const FeedbackForm = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderItemId = searchParams.get('orderItemId');

  useEffect(() => {
    const target = orderItemId
      ? `/orders/${orderId}?orderItemId=${orderItemId}#order-feedback`
      : `/orders/${orderId}#order-feedback`;
    navigate(target, { replace: true });
  }, [orderId, orderItemId, navigate]);

  return null;
};

export default FeedbackForm;
