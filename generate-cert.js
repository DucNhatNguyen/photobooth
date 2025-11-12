const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, 'certs');

// Tạo thư mục certs nếu chưa tồn tại
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

const keyPath = path.join(certsDir, 'localhost.key');
const certPath = path.join(certsDir, 'localhost.crt');

// Kiểm tra xem chứng chỉ đã tồn tại chưa
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ Chứng chỉ SSL đã tồn tại!');
  process.exit(0);
}

console.log('🔐 Đang tạo chứng chỉ SSL tự ký...');

try {
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = selfsigned.generate(attrs, {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256',
    extensions: [
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 7, ip: '127.0.0.1' }
        ]
      }
    ]
  });

  fs.writeFileSync(keyPath, pems.private);
  fs.writeFileSync(certPath, pems.cert);

  console.log('✅ Chứng chỉ SSL đã được tạo thành công!');
  console.log('📁 File được tạo:');
  console.log('   - ' + certPath);
  console.log('   - ' + keyPath);
} catch (error) {
  console.error('❌ Lỗi khi tạo chứng chỉ SSL:', error.message);
  process.exit(1);
}
