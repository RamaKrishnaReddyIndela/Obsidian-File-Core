// middlewares/validators/userValidators.js

function isObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

function trimString(s) {
  return typeof s === 'string' ? s.trim() : s;
}

function sanitizeAddress(address) {
  if (!isObject(address)) return {};
  return {
    line1: trimString(address.line1 || ''),
    line2: trimString(address.line2 || ''),
    city: trimString(address.city || ''),
    state: trimString(address.state || ''),
    country: trimString(address.country || ''),
    zip: trimString(address.zip || ''),
  };
}

function sanitizeCompany(company) {
  if (!isObject(company)) return {};
  return {
    name: trimString(company.name || ''),
    registrationNumber: trimString(company.registrationNumber || ''),
    website: trimString(company.website || ''),
    address: sanitizeAddress(company.address || {}),
  };
}

function sanitizePreferences(prefs) {
  if (!isObject(prefs)) return {};
  const allowedThemes = ['light', 'dark', 'system'];
  const theme = prefs.theme && allowedThemes.includes(prefs.theme) ? prefs.theme : undefined;
  const language = prefs.language ? trimString(prefs.language) : undefined;
  const notifications = isObject(prefs.notifications)
    ? {
        email: typeof prefs.notifications.email === 'boolean' ? prefs.notifications.email : undefined,
        sms: typeof prefs.notifications.sms === 'boolean' ? prefs.notifications.sms : undefined,
      }
    : undefined;
  return {
    ...(theme ? { theme } : {}),
    ...(language ? { language } : {}),
    ...(notifications ? { notifications } : {}),
  };
}

exports.validateUpdateProfile = (req, res, next) => {
  const errors = [];
  const {
    fullName,
    email,
    password,
    zkpPublicKey,
    phone,
    address,
    company,
    preferences,
    role,
  } = req.body || {};

  if (fullName !== undefined && typeof fullName !== 'string') errors.push('fullName must be a string');
  if (email !== undefined && typeof email !== 'string') errors.push('email must be a string');
  if (phone !== undefined && typeof phone !== 'string') errors.push('phone must be a string');
  if (zkpPublicKey !== undefined && typeof zkpPublicKey !== 'string') errors.push('zkpPublicKey must be a string');
  if (password !== undefined && typeof password !== 'string') errors.push('password must be a string');

  if (email) {
    const e = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(e)) errors.push('email is not valid');
    req.body.email = e;
  }

  if (phone) {
    // loose E.164-ish or local formats: keep simple validation
    const p = phone.trim();
    if (p.length > 0 && !/^\+?[0-9\-()\s]{6,20}$/.test(p)) errors.push('phone format is invalid');
    req.body.phone = p;
  }

  if (address !== undefined) {
    if (!isObject(address)) errors.push('address must be an object');
    else req.body.address = sanitizeAddress(address);
  }

  if (company !== undefined) {
    if (!isObject(company)) errors.push('company must be an object');
    else req.body.company = sanitizeCompany(company);
  }

  if (preferences !== undefined) {
    if (!isObject(preferences)) errors.push('preferences must be an object');
    else req.body.preferences = sanitizePreferences(preferences);
  }

  if (role !== undefined) {
    if (!['user', 'admin'].includes(role)) errors.push('role must be either user or admin');
  }

  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

  // Trim top-level strings
  if (typeof req.body.fullName === 'string') req.body.fullName = req.body.fullName.trim();
  if (typeof req.body.zkpPublicKey === 'string') req.body.zkpPublicKey = req.body.zkpPublicKey.trim();

  return next();
};