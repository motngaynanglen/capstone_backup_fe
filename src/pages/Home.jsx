import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '@google/model-viewer';
import { Spin, Empty } from 'antd';

import conceptTagApi from '../api/conceptTagApi';
import designVariantApi from '../api/designVariantApi';
import ProductCard from '../components/catalog/ProductCard';
import {
  FALLBACK_GLBS,
  normalizeVariant,
  pickFallbackGlb,
  sortFeaturedVariants,
} from '../utils/catalogProduct';

const SUGGESTED_LIMIT = 8;
const CATEGORY_LIMIT = 6;

const Interactive3DCard = ({ title, description, modelSrc, to }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={to}
      className="group relative block overflow-hidden rounded-xl bg-slate-900 border border-slate-700 no-underline h-48 sm:h-56 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0">
        <model-viewer
          src={modelSrc}
          camera-controls={isHovered ? true : undefined}
          auto-rotate
          shadow-intensity="1"
          environment-image="neutral"
          exposure="1.2"
          interaction-prompt="none"
          style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
        />
      </div>
      <div className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4">
        <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-indigo-300 transition-colors leading-tight m-0">
          {title}
        </h3>
        {description && (
          <p className="text-[10px] sm:text-xs text-slate-300 mt-0.5 line-clamp-2 m-0">{description}</p>
        )}
        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 m-0">
          {isHovered ? 'Kéo để xem 360°' : 'Khám phá ngay'}
        </p>
      </div>
      {isHovered && (
        <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
          3D Live
        </div>
      )}
    </Link>
  );
};

const HeroModelViewer = ({ modelSrc }) => (
  <div className="relative rounded-2xl bg-slate-900/10 border border-white/20 p-4 backdrop-blur">
    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-900/40">
      <model-viewer
        src={modelSrc}
        camera-controls
        auto-rotate
        shadow-intensity="1"
        environment-image="neutral"
        exposure="1.2"
        interaction-prompt="none"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
    <div className="mt-3 space-y-1 text-xs text-indigo-100">
      <div className="flex justify-between">
        <span>Công nghệ</span>
        <span className="font-semibold">FDM / SLA / Resin</span>
      </div>
      <div className="flex justify-between">
        <span>Thời gian</span>
        <span className="font-semibold">24h – 72h</span>
      </div>
      <div className="flex justify-between">
        <span>Tư vấn file</span>
        <span className="font-semibold">Miễn phí</span>
      </div>
    </div>
  </div>
);

const PrinterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
  </svg>
);

const TruckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const SectionHeader = ({ title, subtitle, linkTo, linkLabel = 'Xem tất cả' }) => (
  <div className="flex items-center justify-between gap-3">
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 m-0">{title}</h2>
      {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">{subtitle}</p>}
    </div>
    {linkTo && (
      <Link to={linkTo} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 no-underline shrink-0">
        {linkLabel} <span className="text-lg">›</span>
      </Link>
    )}
  </div>
);

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [conceptTags, setConceptTags] = useState([]);
  const [allVariants, setAllVariants] = useState([]);
  const [categoryCards, setCategoryCards] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [tagRes, variantRes] = await Promise.all([
          conceptTagApi.getAll(),
          designVariantApi.getAll({ isActive: true }),
        ]);

        if (cancelled) return;

        const tags = (Array.isArray(tagRes?.data) ? tagRes.data : [])
          .filter((t) => t.isActive !== false)
          .sort((a, b) => {
            if (a.isMainTag !== b.isMainTag) return (b.isMainTag ? 1 : 0) - (a.isMainTag ? 1 : 0);
            return (a.name || '').localeCompare(b.name || '', 'vi');
          });

        const variants = (Array.isArray(variantRes?.data) ? variantRes.data : []).map(normalizeVariant);
        setConceptTags(tags);
        setAllVariants(variants);

        const featuredTags = tags.filter((t) => t.isMainTag).slice(0, CATEGORY_LIMIT);
        const tagsForCards = featuredTags.length > 0 ? featuredTags : tags.slice(0, CATEGORY_LIMIT);

        const cards = await Promise.all(
          tagsForCards.map(async (tag) => {
            try {
              const res = await designVariantApi.getAll({
                isActive: true,
                conceptTagId: tag.id,
              });
              const list = (Array.isArray(res?.data) ? res.data : []).map(normalizeVariant);
              const preview = sortFeaturedVariants(list)[0];
              return {
                id: tag.id,
                title: tag.name,
                description: tag.description,
                modelSrc: preview?.modelSrc || pickFallbackGlb(tag.id),
                productCount: list.length,
              };
            } catch {
              return {
                id: tag.id,
                title: tag.name,
                description: tag.description,
                modelSrc: pickFallbackGlb(tag.id),
                productCount: 0,
              };
            }
          })
        );

        if (!cancelled) setCategoryCards(cards);
      } catch (err) {
        console.error('Home load error:', err);
        if (!cancelled) {
          setConceptTags([]);
          setAllVariants([]);
          setCategoryCards([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestedProducts = useMemo(
    () => sortFeaturedVariants(allVariants).slice(0, SUGGESTED_LIMIT),
    [allVariants]
  );

  const inStockCount = useMemo(
    () => allVariants.filter((p) => p.stock > 0).length,
    [allVariants]
  );

  const heroModelSrc = suggestedProducts[0]?.modelSrc || categoryCards[0]?.modelSrc || FALLBACK_GLBS[0];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[320px]">
        <Spin size="large" tip="Đang tải cửa hàng..." />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Thống kê nhanh */}
      {allVariants.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Sản phẩm', value: allVariants.length },
            { label: 'Còn hàng', value: inStockCount },
            { label: 'Danh mục', value: conceptTags.length },
            { label: 'Xem 3D', value: 'Trực tiếp' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-white border border-slate-200 px-4 py-3 text-center shadow-sm">
              <p className="text-lg sm:text-xl font-bold text-indigo-600 m-0">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 m-0">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1.7fr)_minmax(0,0.9fr)] gap-5">
        <aside className="hidden lg:block rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 font-semibold text-sm text-slate-800">
            Danh mục sản phẩm
          </div>
          <ul className="divide-y divide-slate-100 text-sm max-h-[420px] overflow-y-auto">
            {conceptTags.length === 0 ? (
              <li className="px-4 py-3 text-slate-400 text-xs">Chưa có danh mục</li>
            ) : (
              conceptTags.map((tag) => (
                <li key={tag.id}>
                  <Link
                    to={`/products?conceptTag=${tag.id}`}
                    className="flex items-center justify-between px-4 py-2.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 no-underline transition-colors"
                  >
                    <span>{tag.name}</span>
                    <span className="text-xs text-slate-400">›</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </aside>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 text-white shadow-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#ffffff33_0,_transparent_55%)]" />
          <div className="relative px-8 py-8 sm:px-10 sm:py-10 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-3 sm:space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide m-0">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Dịch vụ in 3D trọn gói
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight m-0">
                Siêu thị in 3D chuyên nghiệp
                <span className="block text-amber-200 text-lg sm:text-xl font-semibold mt-1">
                  {allVariants.length > 0
                    ? `${allVariants.length} mẫu in sẵn — xem 3D trước khi mua`
                    : 'Nhận thiết kế, in ấn & giao hàng toàn quốc'}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-indigo-100 max-w-xl m-0">
                Từ mô hình sưu tầm đến linh kiện kỹ thuật, chọn vật liệu PLA / PETG / Resin và đặt in theo yêu cầu.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-slate-50 no-underline"
                >
                  Xem sản phẩm in sẵn
                </Link>
                <Link
                  to="/custom-order"
                  className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 no-underline"
                >
                  Đặt in theo yêu cầu
                </Link>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:w-60 lg:w-72">
              <HeroModelViewer modelSrc={heroModelSrc} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-white border border-amber-200 shadow-sm p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 m-0">Ưu đãi tháng này</p>
                <p className="text-sm font-semibold text-slate-900 m-0">Giảm đến 20% cho đơn hàng đầu tiên</p>
              </div>
              <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">-20%</span>
            </div>
            <p className="mt-2 text-xs text-slate-500 m-0">
              Áp dụng khi thanh toán. Mã <b>3DNEW20</b> (nếu được kích hoạt trên hệ thống).
            </p>
          </div>
          <div className="rounded-xl bg-slate-900 text-slate-50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300 m-0">Hỗ trợ nhanh</p>
            <p className="mt-1 text-sm font-semibold m-0">Tư vấn file & vật liệu miễn phí</p>
            <p className="mt-2 text-xs text-slate-300 m-0">
              Gửi file STL/OBJ/GLB hoặc ảnh tham khảo — kỹ thuật viên báo giá qua Mainflow2.
            </p>
            <Link to="/custom-order" className="inline-block mt-3 text-xs font-semibold text-emerald-300 hover:text-emerald-200 no-underline">
              Bắt đầu đặt in →
            </Link>
          </div>
        </div>
      </section>

      {/* Danh mục nổi bật */}
      <section className="space-y-4">
        <SectionHeader
          title="Danh mục nổi bật"
          subtitle="Lọc theo nhóm sản phẩm từ hệ thống — xem 3D trực tiếp"
          linkTo="/products"
        />
        {categoryCards.length === 0 ? (
          <Empty description="Chưa có danh mục nổi bật" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
            {categoryCards.map((card) => (
              <Interactive3DCard
                key={card.id}
                title={card.title}
                description={
                  card.productCount > 0
                    ? `${card.productCount} sản phẩm · ${card.description || ''}`.trim()
                    : card.description
                }
                modelSrc={card.modelSrc}
                to={`/products?conceptTag=${card.id}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Gợi ý */}
      <section className="space-y-4">
        <SectionHeader
          title="Gợi ý cho bạn"
          subtitle="Biến thể in 3D đang bán — ưu tiên còn hàng"
          linkTo="/products"
        />
        {suggestedProducts.length === 0 ? (
          <Empty description="Chưa có sản phẩm. Hãy thử đặt in theo yêu cầu.">
            <Link to="/custom-order" className="text-indigo-600 font-medium no-underline">
              Đặt in custom
            </Link>
          </Empty>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {suggestedProducts.map((p) => (
              <ProductCard key={p.id} product={p} viewMode="grid" />
            ))}
          </div>
        )}
      </section>

      {/* CTA custom */}
      <section className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold m-0">Có file riêng hoặc cần AI tạo mô hình?</h3>
          <p className="text-sm text-slate-300 mt-2 m-0 max-w-lg">
            Upload STL/GLB, hoặc gửi ảnh để AI tạo GLB — kỹ thuật viên báo giá, chat và duyệt giá trực tuyến.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            to="/custom-order/upload"
            className="rounded-full bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold no-underline hover:bg-slate-100"
          >
            Upload file
          </Link>
          <Link
            to="/custom-order/ai-generate"
            className="rounded-full border border-white/50 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-white/10"
          >
            AI tạo mô hình
          </Link>
        </div>
      </section>

      {/* Lợi ích */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: <PrinterIcon />,
            color: 'bg-indigo-600',
            title: 'Máy in công nghiệp',
            desc: 'FDM, resin và nhiều vật liệu — chi tiết chính xác, bề mặt đẹp.',
          },
          {
            icon: <TruckIcon />,
            color: 'bg-emerald-600',
            title: 'Đóng gói & giao nhanh',
            desc: 'Tích hợp GHN, theo dõi vận đơn trực tuyến sau khi đơn sẵn sàng giao.',
          },
          {
            icon: <UserIcon />,
            color: 'bg-amber-500',
            title: 'Đội ngũ kỹ sư hỗ trợ',
            desc: 'Tư vấn file, báo giá Mainflow2 và duyệt thiết kế qua chat.',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-xl bg-white border border-slate-200 p-4 flex gap-3">
            <div className={`h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full ${item.color} text-white`}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 m-0">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500 m-0">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Home;
