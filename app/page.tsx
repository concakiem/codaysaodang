"use client";
import { useState } from "react";

const reviews = [
  { name: "Nguyễn Văn Hùng", city: "Hà Nội", stars: 5, text: "Cờ dây đẹp lắm, sao vàng nổi bật, dây dài vừa đủ treo trước nhà. Giao hàng rất nhanh!" },
  { name: "Trần Thị Mai", city: "TP.HCM", stars: 5, text: "Mua dịp 2/9 trang trí đường phố, màu sắc tươi sáng, không phai. Sẽ ủng hộ shop lần sau." },
  { name: "Lê Minh Quân", city: "Đà Nẵng", stars: 5, text: "Mua số lượng lớn cho khu dân cư, giá tốt, shop hỗ trợ nhiệt tình, đóng gói cẩn thận." },
  { name: "Phạm Thanh Liêm", city: "Cần Thơ", stars: 5, text: "Cờ dây chất lượng tốt, treo dọc đường rất đẹp mắt. Rất hài lòng với sản phẩm!" },
];

const specs = [
  { icon: "📏", label: "Chiều dài dây", value: "10 mét / dây" },
  { icon: "🏴", label: "Số lượng cờ", value: "20 lá / dây" },
  { icon: "📐", label: "Kích thước cờ", value: "14×21 cm / lá" },
  { icon: "🧵", label: "Chất liệu", value: "Vải phi bóng cao cấp" },
  { icon: "🎨", label: "Màu sắc", value: "Đỏ tươi — Sao vàng nổi bật" },
  { icon: "✂️", label: "Đường may", value: "Viền chắc, không tuột chỉ" },
];

const features = [
  { icon: "🚚", title: "Miễn phí vận chuyển", desc: "MIỄN PHÍ SHIP 100% cho mọi đơn hàng, không giới hạn số lượng, giao tận nhà toàn quốc" },
  { icon: "⚡", title: "Giao hàng 24h", desc: "Đặt hôm nay, nhận hàng ngay ngày mai. Hỗ trợ ship toàn quốc 63 tỉnh thành" },
  { icon: "💰", title: "Giá sỉ tốt nhất", desc: "Chiết khấu hấp dẫn cho đơn từ 10 dây trở lên, phù hợp cơ quan, trường học, khu phố" },
  { icon: "🎨", title: "Màu đúng chuẩn", desc: "Đỏ tươi chuẩn Đảng kỳ, sao vàng rõ nét, không bị lem màu dù treo ngoài trời nắng mưa" },
];

function StarRating({ stars }: { stars: number }) {
  return <span className="stars">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>;
}

type FormData = { name: string; phone: string; address: string; quantity: string; note: string };
type FormErrors = Partial<Record<keyof FormData, string>>;

const PRICE = 55000;

export default function Home() {
  const [form, setForm] = useState<FormData>({ name: "", phone: "", address: "", quantity: "1", note: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [apiError, setApiError] = useState("");

  const qty = Math.max(1, parseInt(form.quantity) || 1);
  const total = PRICE * qty;

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!/^(0|\+84)[0-9]{8,10}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Số điện thoại không hợp lệ";
    if (!form.address.trim()) e.address = "Vui lòng nhập địa chỉ nhận hàng";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (k: keyof FormData, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setApiError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone, address: form.address, quantity: qty, note: form.note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khi gửi đơn hàng");
      setOrderId(data.orderId);
      setSubmitted(true);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Đã xảy ra lỗi, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setOrderId(null);
    setApiError("");
    setForm({ name: "", phone: "", address: "", quantity: "1", note: "" });
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      {/* NAVBAR */}
      <nav className="nav">
        <div className="nav-brand">🚩 CờViệt</div>
        <div className="nav-links">
          <a href="#specs">Thông số</a>
          <a href="#reviews">Đánh giá</a>
          <a href="#order">Đặt hàng</a>
        </div>
        <button className="nav-btn" onClick={() => scrollTo("order")}>
          Đặt hàng ngay
        </button>
      </nav>

      {/* FREE SHIP BANNER */}
      <div className="freeship-banner">
        <span className="fsb-item">🚚 MIỄN PHÍ VẬN CHUYỂN toàn quốc cho mọi đơn hàng</span>
        <span className="fsb-dot">·</span>
        <span className="fsb-item">📦 Giao hàng trong 24h</span>
        {/* <span className="fsb-dot">·</span>
        <span className="fsb-item">🎁 Ưu đãi sỉ từ 10 dây</span> */}
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <div className="hero-badge">🏅 Sản phẩm bán chạy số 1</div>
          <div className="hero-freeship-pill">🚚 MIỄN PHÍ SHIP — Giao tận nhà toàn quốc</div>
          <h1 className="hero-title">
            Cờ Dây
            <em>Sao Đảng</em>
          </h1>
          <p className="hero-desc">
            Cờ dây sao đảng vải phi bóng cao cấp — màu sắc chuẩn, đường may chắc, phù hợp trang trí đường phố, cơ quan, khu dân cư trong các dịp lễ lớn.
          </p>
          <div className="hero-price-wrap">
            <span className="hero-price">55.000đ</span>
            <span className="hero-original">75.000đ</span>
            <span className="hero-discount">–36%</span>
          </div>
          <div className="hero-cta-row">
            <button className="btn-main" onClick={() => scrollTo("order")}>🛒 Đặt hàng ngay</button>
            <button className="btn-outline" onClick={() => scrollTo("specs")}>Xem thông số</button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="rope-container">
            <span className="rope-label">Cờ Dây Sao Đảng — 10m / dây</span>
            {[0, 1, 2].map((row) => (
              <div className="rope-row" key={row}>
                <div className="rope-line" />
                {Array.from({ length: 7 }).map((_, i) => (
                  <div className="mini-flag" key={i}>⭐</div>
                ))}
                <div className="rope-line" />
              </div>
            ))}
            <div className="rope-stats">
              <div className="rs-item"><div className="rs-num">10m</div><div className="rs-label">Dài/dây</div></div>
              <div className="rs-item"><div className="rs-num">20 lá</div><div className="rs-label">Số cờ</div></div>
              <div className="rs-item"><div className="rs-num">24h</div><div className="rs-label">Giao hàng</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* WAVE */}
      <div className="wave">
        <svg viewBox="0 0 1440 56" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ height: 56, background: "#F0021F" }}>
          <path d="M0,56 C480,0 960,0 1440,56 L1440,56 L0,56 Z" fill="#fff" />
        </svg>
      </div>

      {/* SPECS */}
      <section className="specs" id="specs">
        <p className="sec-label">Thông số sản phẩm</p>
        <h2 className="sec-title">Cờ dây <em>chất lượng cao</em></h2>
        <div className="specs-grid">
          {specs.map((s, i) => (
            <div className="spec-card" key={i}>
              <div className="spec-icon">{s.icon}</div>
              <div>
                <div className="spec-label">{s.label}</div>
                <div className="spec-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <p className="sec-label">Cam kết của chúng tôi</p>
        <h2 className="sec-title">Vì sao chọn <em>CờViệt</em>?</h2>
        <div className="feats-grid">
          {features.map((f, i) => (
            <div className="feat-card" key={i}>
              <div className="feat-icon">{f.icon}</div>
              <div className="feat-title">{f.title}</div>
              <div className="feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="reviews" id="reviews">
        <p className="sec-label">Khách hàng đánh giá</p>
        <h2 className="sec-title" style={{ color: "#fff" }}>
          Hơn 10.000 đơn hàng <em style={{ color: "var(--gold)" }}>hài lòng</em>
        </h2>
        <div className="reviews-grid">
          {reviews.map((r, i) => (
            <div className="review-card" key={i}>
              <StarRating stars={r.stars} />
              <p className="review-text">&ldquo;{r.text}&rdquo;</p>
              <div className="review-author">{r.name}</div>
              <div className="review-city">📍 {r.city}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ORDER FORM */}
      <section className="order-section" id="order">
        <p className="sec-label">Đặt hàng online</p>
        <h2 className="sec-title" style={{ color: "#fff" }}>
          Điền thông tin <em style={{ color: "var(--gold)" }}>nhận hàng</em>
        </h2>

        <div className="order-wrap">
          {submitted ? (
            <div className="success-box">
              <div className="success-icon">🎉</div>
              <h3 className="success-title">Đặt hàng <em>thành công!</em></h3>
              {orderId && (
                <div className="success-order-id">
                  <span className="oid-label">Mã đơn hàng · </span>
                  <span className="oid-value">#{String(orderId).padStart(4, "0")}</span>
                </div>
              )}
              <p className="success-desc">
                Cảm ơn bạn đã tin tưởng CờViệt! Đơn hàng đã được lưu. Chúng tôi sẽ liên hệ xác nhận trong vòng 30 phút. Giao hàng trong 24h!
              </p>
              <button className="success-back" onClick={resetForm}>
                Đặt thêm đơn mới
              </button>
            </div>
          ) : (
            <>
              {/* Product summary */}
              <div className="order-summary">
                <div className="os-product">
                  <span className="os-flag">🚩</span>
                  <div>
                    <div className="os-name">Cờ Dây Sao Đảng — Vải Phi Bóng</div>
                    <div className="os-meta">10m / dây · 20 lá · Giao hàng 24h</div>
                  </div>
                </div>
                <div className="os-price">
                  55.000đ
                  <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "rgba(255,215,0,0.7)" }}> / dây</span>
                </div>
              </div>

              {/* Quantity */}
              <div className="qty-row">
                <span className="qty-label">Số lượng:</span>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => handleChange("quantity", String(Math.max(1, qty - 1)))}>−</button>
                  <input
                    className="qty-input"
                    type="number" min={1}
                    value={form.quantity}
                    onChange={(e) => handleChange("quantity", e.target.value)}
                  />
                  <button className="qty-btn" onClick={() => handleChange("quantity", String(qty + 1))}>+</button>
                </div>
                <span className="qty-total">
                  Tổng: <strong>{total.toLocaleString("vi-VN")}đ</strong>
                </span>
              </div>

              {/* API error */}
              {apiError && <div className="api-error">⚠ {apiError}</div>}

              {/* Fields */}
              <div className="field-group">
                <label className="field-label">Họ và tên <span>*</span></label>
                <input
                  className={`field-input${errors.name ? " error" : ""}`}
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
                {errors.name && <span className="field-error">⚠ {errors.name}</span>}
              </div>

              <div className="field-group">
                <label className="field-label">Số điện thoại <span>*</span></label>
                <input
                  className={`field-input${errors.phone ? " error" : ""}`}
                  placeholder="0912 345 678"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
                {errors.phone && <span className="field-error">⚠ {errors.phone}</span>}
              </div>

              <div className="field-group">
                <label className="field-label">Địa chỉ nhận hàng <span>*</span></label>
                <input
                  className={`field-input${errors.address ? " error" : ""}`}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
                {errors.address && <span className="field-error">⚠ {errors.address}</span>}
              </div>

              <div className="field-group">
                <label className="field-label">Ghi chú đơn hàng</label>
                <textarea
                  className="field-input"
                  placeholder="Ghi chú thêm về đơn hàng, yêu cầu đặc biệt..."
                  value={form.note}
                  onChange={(e) => handleChange("note", e.target.value)}
                />
              </div>

              <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? <><span className="spinner" />Đang xử lý...</>
                  : `🛒 Xác nhận đặt hàng — ${total.toLocaleString("vi-VN")}đ`
                }
              </button>
            </>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact-section" id="contact">
        <p className="sec-label">Kênh liên hệ</p>
        <h2 className="sec-title contact-title">Liên hệ <em>đặt hàng ngay</em></h2>
        <p className="contact-desc">Gọi hoặc nhắn Zalo để được tư vấn, báo giá sỉ và hỗ trợ đặt hàng nhanh nhất</p>
        <div className="contact-cards">
          <a className="contact-card contact-card--phone" href="tel:0336061457">
            <div className="cc-icon">📞</div>
            <div className="cc-label">Hotline</div>
            <div className="cc-value">0336 061 457</div>
            <div className="cc-sub">Gọi ngay — Hỗ trợ 8h–21h</div>
          </a>
          <a className="contact-card contact-card--zalo" href="https://zalo.me/0336061457" target="_blank" rel="noopener noreferrer">
            <div className="cc-icon">💬</div>
            <div className="cc-label">Zalo</div>
            <div className="cc-value">0336 061 457</div>
            <div className="cc-sub">Nhắn tin — Phản hồi nhanh</div>
          </a>
          <div className="contact-card contact-card--ship">
            <div className="cc-icon">🚚</div>
            <div className="cc-label">Vận chuyển</div>
            <div className="cc-value">Miễn phí 100%</div>
            <div className="cc-sub">Giao toàn quốc — Mọi đơn hàng</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-brand">🚩 CờViệt — Tự hào Tổ Quốc</div>
        <div className="footer-mid">
          <a href="tel:0336061457" className="footer-link">📞 0336 061 457</a>
          <span className="footer-sep">·</span>
          <a href="https://zalo.me/0336061457" className="footer-link" target="_blank" rel="noopener noreferrer">💬 Zalo</a>
          <span className="footer-sep">·</span>
          <span className="footer-link">🚚 Miễn phí ship</span>
        </div>
        <div className="footer-copy">© 2025 CờViệt. Giao hàng toàn quốc.</div>
      </footer>
    </>
  );
}