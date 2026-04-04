-- Update TMB to TTB and add logo_url to all banks
UPDATE bank SET bank_code = 'TTB', logo_url = '/Bank_logo/TTB.png' WHERE bank_code = 'TMB';
UPDATE bank SET logo_url = '/Bank_logo/BBL.png' WHERE bank_code = 'BBL';
UPDATE bank SET logo_url = '/Bank_logo/KBANK.png' WHERE bank_code = 'KBANK';
UPDATE bank SET logo_url = '/Bank_logo/KTB.png' WHERE bank_code = 'KTB';
UPDATE bank SET logo_url = '/Bank_logo/SCB.png' WHERE bank_code = 'SCB';
INSERT INTO bank (bank_code, name, logo_url) VALUES ('GSB', 'ธนาคารออมสิน', '/Bank_logo/GSB.png') ON CONFLICT (bank_code) DO UPDATE SET logo_url = '/Bank_logo/GSB.png';
