const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const securityToolsController = require('../controllers/securityToolsController');

// Certificate Management routes
router.post('/certificate-manager', authMiddleware, securityToolsController.certificateManager);

// Two-Factor Authentication (TOTP) routes
router.post('/totp-manager', authMiddleware, securityToolsController.totpManager);

// Network Security Scanner routes
router.post('/network-scanner', authMiddleware, securityToolsController.networkScanner);

// SSH Key Management routes
router.post('/ssh-key-manager', authMiddleware, securityToolsController.sshKeyManager);

// Password Policy Analyzer routes
router.post('/password-analyzer', authMiddleware, securityToolsController.passwordAnalyzer);

// Backup and Recovery routes
router.post('/backup-manager', authMiddleware, securityToolsController.backupManager);

// Compliance Audit routes
router.post('/compliance-auditor', authMiddleware, securityToolsController.complianceAuditor);

// VPN Configuration Generator routes
router.post('/vpn-config-generator', authMiddleware, securityToolsController.vpnConfigGenerator);

// Secure Communication Tool routes
router.post('/secure-messenger', authMiddleware, securityToolsController.secureMessenger);

// Hardware Security Module Interface routes
router.post('/hsm-interface', authMiddleware, securityToolsController.hsmInterface);

module.exports = router;
