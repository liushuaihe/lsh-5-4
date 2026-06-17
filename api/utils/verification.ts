// 身份证号校验工具
// 实现ISO 7064:1983.MOD 11-2校验位算法

// 加权因子
const WEIGHTING_FACTORS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];

// 校验码映射
const CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

// 省份代码（简化版，常用省份）
const PROVINCE_CODES: Record<string, string> = {
  '11': '北京市', '12': '天津市', '13': '河北省', '14': '山西省', '15': '内蒙古自治区',
  '21': '辽宁省', '22': '吉林省', '23': '黑龙江省',
  '31': '上海市', '32': '江苏省', '33': '浙江省', '34': '安徽省', '35': '福建省', '36': '江西省', '37': '山东省',
  '41': '河南省', '42': '湖北省', '43': '湖南省', '44': '广东省', '45': '广西壮族自治区',
  '50': '重庆市', '51': '四川省', '52': '贵州省', '53': '云南省', '54': '西藏自治区',
  '61': '陕西省', '62': '甘肃省', '63': '青海省', '64': '宁夏回族自治区', '65': '新疆维吾尔自治区',
  '71': '台湾省', '81': '香港特别行政区', '82': '澳门特别行政区',
};

export interface IdCardValidationResult {
  valid: boolean;
  error?: string;
  info?: {
    province: string;
    birthday: string;
    age: number;
    gender: string;
  };
}

export interface NameIdMatchResult {
  match: boolean;
  confidence: number;
  message: string;
}

export interface TicketValidationResult {
  valid: boolean;
  error?: string;
  info?: {
    ticketType: string;
    isValidFormat: boolean;
  };
}

// 校验身份证号校验位
function validateCheckDigit(idCard: string): boolean {
  if (idCard.length !== 18) return false;
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i], 10) * WEIGHTING_FACTORS[i];
  }
  
  const checkIndex = sum % 11;
  const expectedCheckCode = CHECK_CODES[checkIndex];
  const actualCheckCode = idCard[17].toUpperCase();
  
  return actualCheckCode === expectedCheckCode;
}

// 校验出生日期
function validateBirthday(birthdayStr: string): { valid: boolean; error?: string; age?: number } {
  if (birthdayStr.length !== 8) {
    return { valid: false, error: '出生日期格式错误' };
  }
  
  const year = parseInt(birthdayStr.slice(0, 4), 10);
  const month = parseInt(birthdayStr.slice(4, 6), 10);
  const day = parseInt(birthdayStr.slice(6, 8), 10);
  
  const currentYear = new Date().getFullYear();
  
  if (year < 1900 || year > currentYear) {
    return { valid: false, error: `出生年份必须在1900-${currentYear}之间` };
  }
  
  if (month < 1 || month > 12) {
    return { valid: false, error: '出生月份必须在1-12之间' };
  }
  
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return { valid: false, error: `出生日期必须在1-${daysInMonth}之间` };
  }
  
  const birthday = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  
  if (age < 0 || age > 150) {
    return { valid: false, error: '年龄不合法' };
  }
  
  return { valid: true, age };
}

// 校验地区码
function validateRegionCode(regionCode: string): { valid: boolean; province?: string; error?: string } {
  const provinceCode = regionCode.slice(0, 2);
  const province = PROVINCE_CODES[provinceCode];
  
  if (!province) {
    return { valid: false, error: `地区码${regionCode}对应的省份不存在` };
  }
  
  return { valid: true, province };
}

// 完整的身份证号校验
export function validateIdCard(idCard: string): IdCardValidationResult {
  // 基础格式校验
  const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  if (!idCardRegex.test(idCard)) {
    return { valid: false, error: '身份证号格式不正确，必须为15位或18位数字（最后一位可为X）' };
  }
  
  // 15位身份证转换为18位进行校验
  let normalizedIdCard = idCard;
  if (idCard.length === 15) {
    normalizedIdCard = idCard.slice(0, 6) + '19' + idCard.slice(6);
  }
  
  // 校验位校验（只对18位身份证）
  if (normalizedIdCard.length === 18) {
    if (!validateCheckDigit(normalizedIdCard)) {
      return { valid: false, error: '身份证号校验位不正确，该身份证号不真实' };
    }
  }
  
  // 地区码校验
  const regionResult = validateRegionCode(normalizedIdCard.slice(0, 6));
  if (!regionResult.valid) {
    return { valid: false, error: regionResult.error };
  }
  
  // 出生日期校验
  const birthdayStr = normalizedIdCard.slice(6, 14);
  const birthdayResult = validateBirthday(birthdayStr);
  if (!birthdayResult.valid) {
    return { valid: false, error: birthdayResult.error };
  }
  
  // 提取性别（第17位，奇数为男，偶数为女）
  const genderDigit = parseInt(normalizedIdCard[16], 10);
  const gender = genderDigit % 2 === 1 ? '男' : '女';
  
  // 格式化出生日期
  const year = birthdayStr.slice(0, 4);
  const month = birthdayStr.slice(4, 6);
  const day = birthdayStr.slice(6, 8);
  const birthday = `${year}年${month}月${day}日`;
  
  return {
    valid: true,
    info: {
      province: regionResult.province!,
      birthday,
      age: birthdayResult.age!,
      gender,
    },
  };
}

// 姓名和身份证一致性验证（模拟公安系统接口）
// 真实环境中需要调用第三方实名认证API
export function verifyNameIdMatch(realName: string, idCard: string): NameIdMatchResult {
  // 先校验身份证号合法性
  const idCardResult = validateIdCard(idCard);
  if (!idCardResult.valid) {
    return {
      match: false,
      confidence: 0,
      message: idCardResult.error || '身份证号不合法',
    };
  }
  
  // 姓名基础校验
  if (!realName || realName.length < 2) {
    return {
      match: false,
      confidence: 0,
      message: '姓名长度至少为2个字符',
    };
  }
  
  // 中文姓名校验
  const chineseNameRegex = /^[\u4e00-\u9fa5·]{2,10}$/;
  if (!chineseNameRegex.test(realName)) {
    return {
      match: false,
      confidence: 0,
      message: '姓名必须为中文字符，长度2-10位',
    };
  }
  
  // 模拟公安系统校验
  // 测试用例：如果姓名是"测试"且身份证号以"11010119900307"开头，返回不匹配
  if (realName === '测试' && idCard.startsWith('11010119900307')) {
    return {
      match: false,
      confidence: 0.1,
      message: '公安系统验证：姓名与身份证号不匹配',
    };
  }
  
  // 黑名单身份证号（模拟）
  const blacklistedIds = ['110101199001011234', '310101199001011234'];
  if (blacklistedIds.includes(idCard.replace(/X$/, 'x').replace(/x$/, 'X'))) {
    return {
      match: false,
      confidence: 0,
      message: '该身份证号已被列入黑名单，请联系客服',
    };
  }
  
  // 模拟验证延迟（模拟网络请求）
  // 真实环境中这里会调用第三方API
  
  // 大多数情况返回匹配成功（模拟真实系统的高通过率）
  const randomFactor = Math.random();
  if (randomFactor > 0.05) {
    return {
      match: true,
      confidence: 0.98,
      message: '公安系统验证：姓名与身份证号匹配成功',
    };
  } else {
    return {
      match: false,
      confidence: 0.2,
      message: '公安系统验证：姓名与身份证号不匹配，请检查信息是否正确',
    };
  }
}

// 购票凭证票号校验
// 模拟真实票号格式验证
export function validateTicketNumber(
  ticketNumber: string,
  concertId: number,
  concertName?: string
): TicketValidationResult {
  if (!ticketNumber) {
    return { valid: false, error: '票号不能为空' };
  }
  
  // 票号格式校验
  // 常见票号格式：
  // 1. 大麦网：DM + 12位数字 或 DAMAI + 10位数字
  // 2. 猫眼：MAOYAN + 12位数字
  // 3. 票星球：PQX + 15位数字
  // 4. 摩天轮：MTL + 12位数字
  // 5. 通用格式：演唱会ID前缀 + 8位数字
  
  const patterns = [
    { regex: /^DM\d{12}$/, type: '大麦网' },
    { regex: /^DAMAI\d{10}$/, type: '大麦网' },
    { regex: /^MAOYAN\d{12}$/, type: '猫眼' },
    { regex: /^PQX\d{15}$/, type: '票星球' },
    { regex: /^MTL\d{12}$/, type: '摩天轮' },
    { regex: /^CNCERT\d{8}$/, type: '官方渠道' },
    { regex: /^\d{10,16}$/, type: '通用电子票' },
  ];
  
  let matchedPattern = null;
  for (const pattern of patterns) {
    if (pattern.regex.test(ticketNumber.toUpperCase())) {
      matchedPattern = pattern;
      break;
    }
  }
  
  if (!matchedPattern) {
    return {
      valid: false,
      error: '票号格式不正确。常见格式示例：DM123456789012、MAOYAN123456789012、PQX123456789012345',
    };
  }
  
  // 票号逻辑校验
  // 检查票号是否包含场次信息
  const concertIdStr = String(concertId);
  if (ticketNumber.includes(concertIdStr)) {
    return {
      valid: true,
      info: {
        ticketType: matchedPattern.type,
        isValidFormat: true,
      },
    };
  }
  
  // 模拟票号真实性校验
  // 黑名单票号（已使用/伪造）
  const blacklistedTickets = [
    'DM000000000000',
    'MAOYAN000000000000',
    'PQX000000000000000',
  ];
  
  if (blacklistedTickets.includes(ticketNumber.toUpperCase())) {
    return {
      valid: false,
      error: '该票号已被标记为无效，可能是伪造或已使用的票号',
    };
  }
  
  // 模拟票号与演唱会匹配度校验
  // 如果演唱会名称包含特定关键词，检查票号是否有对应标识
  if (concertName) {
    if (concertName.includes('周杰伦') && !ticketNumber.toUpperCase().includes('JAY')) {
      // 这只是一个模拟检查，真实环境不会这样
    }
  }
  
  // 票号长度校验
  if (ticketNumber.length < 8 || ticketNumber.length > 20) {
    return {
      valid: false,
      error: '票号长度必须在8-20个字符之间',
    };
  }
  
  return {
    valid: true,
    info: {
      ticketType: matchedPattern.type,
      isValidFormat: true,
    },
  };
}

// 生成测试用的有效身份证号（供开发测试使用）
export function generateValidIdCard(birthday?: string, gender?: 'male' | 'female'): string {
  // 使用北京地区码
  const regionCode = '110101';
  
  // 生成出生日期
  let birthDate = birthday;
  if (!birthDate) {
    const year = 1990 + Math.floor(Math.random() * 20);
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    birthDate = `${year}${month}${day}`;
  }
  
  // 生成顺序码
  let sequenceCode = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  if (gender === 'male') {
    sequenceCode = String(parseInt(sequenceCode, 10) | 1);
  } else if (gender === 'female') {
    sequenceCode = String(parseInt(sequenceCode, 10) & 0xfe);
  }
  
  // 计算校验位
  const first17 = regionCode + birthDate + sequenceCode;
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(first17[i], 10) * WEIGHTING_FACTORS[i];
  }
  const checkIndex = sum % 11;
  const checkCode = CHECK_CODES[checkIndex];
  
  return first17 + checkCode;
}
