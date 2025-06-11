import { exec } from 'child_process';

exec('Stop-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess -Force', (error) => {
  if (error) {
    console.error('服务停止失败:', error);
    process.exit(1);
  }
  console.log('服务已成功停止');
});