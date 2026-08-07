INSERT INTO "ContentSlot" ("id", "title", "purpose", "acceptedMimeTypes", "maxFileSize", "learnerEligible") VALUES
('learner-visual', '孩子页面图片', '低刺激视觉提示', ARRAY['image/png','image/jpeg'], 5242880, true),
('learner-audio', '审核英语音频', '家长审核后的美式英语示范与朗读', ARRAY['audio/mpeg','audio/wav'], 26214400, true),
('learner-video', '孩子页面视频', '低刺激家庭教学视频', ARRAY['video/mp4'], 26214400, true),
('flash-card-activity', 'Flash Cards / 活动说明', '家庭自有闪卡导航和原创活动说明', ARRAY['image/png','image/jpeg','application/pdf','text/plain'], 10485760, true),
('wordless-reading', '无字书 / 朗读', '家庭自有无字书导航或家长原创朗读材料', ARRAY['image/png','image/jpeg','audio/mpeg','audio/wav','application/pdf'], 26214400, true),
('decodable-reading', '可解码阅读', '符合当前可解码范围的家庭原创或获授权材料', ARRAY['application/pdf','text/plain','image/png','image/jpeg'], 26214400, true),
('ort-navigation', 'ORT 实体书导航', '只记录家庭实体书标题、级别和取用位置', ARRAY['text/plain'], 1048576, true),
('lesson-review', '课前回顾', '已接触目标的低刺激回顾材料', ARRAY['image/png','image/jpeg','audio/mpeg','audio/wav','text/plain'], 26214400, true),
('independent-practice', '独立巩固', '仅用于已陪伴接触目标的独立巩固', ARRAY['image/png','image/jpeg','audio/mpeg','audio/wav','text/plain'], 26214400, true),
('parent-reference', '家长参考', '只供家长准备和参考', ARRAY['image/png','image/jpeg','application/pdf','text/plain'], 26214400, false)
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "purpose" = EXCLUDED."purpose", "acceptedMimeTypes" = EXCLUDED."acceptedMimeTypes", "maxFileSize" = EXCLUDED."maxFileSize", "learnerEligible" = EXCLUDED."learnerEligible";
