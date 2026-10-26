import React from 'react';

export const STAMP_DESIGNS = [
  { id: 'rose', name: 'Hoa Hồng Đỏ', icon: '🌹', color: '#b83232', desc: 'Tình yêu nồng nàn' },
  { id: 'dove', name: 'Bồ Câu Đưa Thư', icon: '🕊️', color: '#4a7c59', desc: 'Bình yên & chung thủy' },
  { id: 'cupid', name: 'Thần Tình Yêu', icon: '💘', color: '#e06d7e', desc: 'Trúng tiếng sét ái tình' },
  { id: 'airmail', name: 'Thư Hàng Không', icon: '✉️', color: '#1b3b6f', desc: 'Par Avion vượt ngàn dặm' },
  { id: 'planet', name: 'Hành Tinh Vũ Trụ', icon: '🪐', color: '#5e4b8b', desc: 'Em là cả dải ngân hà' },
  { id: 'bear', name: 'Gấu Bông Cute', icon: '🧸', color: '#9e6d42', desc: 'Ấm áp ngọt ngào' },
  { id: 'blossom', name: 'Cánh Đào Hồng', icon: '🌸', color: '#ea7a9d', desc: 'Xuân sắc đầu mùa' },
  { id: 'coffee', name: 'Cà Phê Chiều', icon: '☕', color: '#7a5230', desc: 'Hẹn hò quán quen' },
  { id: 'custom', name: 'Tem Ảnh Đôi', icon: '📸', color: '#e06d7e', desc: 'Ảnh chụp của hai bạn' }
];

export const ENVELOPE_THEMES = [
  { id: 'dusty_rose', name: 'Hồng Dusty Vintage', colorHex: '#b87a8b', className: 'env-dusty_rose', desc: 'Lãng mạn, cổ điển' },
  { id: 'kraft', name: 'Giấy Kraft Mộc Mạc', colorHex: '#c79e6e', className: 'env-kraft', desc: 'Ấm áp, hoài niệm' },
  { id: 'navy', name: 'Xanh Đêm Tinh Tú', colorHex: '#2d3e52', className: 'env-navy', desc: 'Huyền bí, sâu lắng' },
  { id: 'lavender', name: 'Tím Mộng Mơ', colorHex: '#9983a8', className: 'env-lavender', desc: 'Ngọt ngào, nhẹ nhàng' },
  { id: 'forest', name: 'Xanh Rêu Rừng Thông', colorHex: '#44634f', className: 'env-forest', desc: 'Bình yên, tươi mát' },
  { id: 'ivory', name: 'Trắng Kem Quý Tộc', colorHex: '#ded4c1', className: 'env-ivory', desc: 'Thanh lịch, tinh tế' },
  { id: 'crimson', name: 'Đỏ Nhung Nồng Say', colorHex: '#9e2a2b', className: 'env-crimson', desc: 'Say đắm, cháy bỏng' }
];

export function PostageStamp({
  design = 'rose',
  imageUrl = null,
  cost = 5,
  size = 'md', // 'sm' | 'md' | 'lg'
  showPostmark = true,
  postmarkDate = null,
  style = {}
}) {
  const currentStamp = STAMP_DESIGNS.find(s => s.id === design) || STAMP_DESIGNS[0];
  const isCustomPhoto = (design === 'custom' || imageUrl) && Boolean(imageUrl);

  const sizeStyles = {
    sm: { width: '48px', height: '58px', iconSize: '20px', fontSize: '7.5px' },
    md: { width: '64px', height: '76px', iconSize: '28px', fontSize: '9px' },
    lg: { width: '84px', height: '100px', iconSize: '36px', fontSize: '11px' }
  }[size] || { width: '64px', height: '76px', iconSize: '28px', fontSize: '9px' };

  const formattedDate = postmarkDate
    ? new Date(postmarkDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '2026.10';

  return (
    <div
      className="postage-stamp"
      style={{
        width: sizeStyles.width,
        height: sizeStyles.height,
        ...style
      }}
      title={`Tem thư: ${currentStamp.name} (${cost} ❤️)`}
    >
      <div className="postage-stamp-inner">
        {isCustomPhoto ? (
          <img
            src={imageUrl}
            alt="Tem ảnh đôi"
            className="postage-stamp-img"
            style={{
              width: '100%',
              height: size === 'sm' ? '34px' : (size === 'lg' ? '64px' : '46px'),
              objectFit: 'cover'
            }}
          />
        ) : (
          <span
            className="postage-stamp-icon"
            style={{ fontSize: sizeStyles.iconSize }}
          >
            {currentStamp.icon}
          </span>
        )}

        <div
          className="postage-stamp-denomination"
          style={{ fontSize: sizeStyles.fontSize }}
        >
          {cost} ❤️ LOVE
        </div>
      </div>

      {/* Realistic Ink Postmark Cancellation Seal */}
      {showPostmark && (
        <>
          <div className="postmark-cancel-seal">
            <span style={{ fontSize: '6.5px' }}>★ AIRMAIL ★</span>
            <span style={{ fontSize: '7.5px' }}>{formattedDate}</span>
            <span style={{ fontSize: '6px' }}>PAR AVION</span>
          </div>
          <div className="postmark-lines" />
        </>
      )}
    </div>
  );
}
