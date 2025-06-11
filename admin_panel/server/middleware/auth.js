import jwt from 'jsonwebtoken';

export default (req, res, next) => {
    try {
        // 环境变量检查
        if (!process.env.JWT_SECRET) {
            throw new Error('缺少JWT_SECRET环境变量配置');
        }

        // 获取Bearer Token
        const authHeader = req.headers.authorization;
        console.log('收到的 Authorization 头部:', authHeader); // 在这里添加日志
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }

        const token = authHeader.split(' ')[1];
        
        // 验证并解码token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.userId,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        console.error('认证错误:', error);
        const statusCode = error.name === 'JsonWebTokenError' ? 401 : 500;
        res.status(statusCode).json({
            message: error.name === 'TokenExpiredError' 
                ? '令牌已过期' 
                : '无效的认证令牌'
        });
    }
}