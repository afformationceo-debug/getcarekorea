/**
 * Google Search Console OAuth Token 획득 스크립트
 *
 * 사용법:
 * 1. Google Cloud Console에서 OAuth 2.0 클라이언트 생성
 * 2. .env.local에 GSC_CLIENT_ID, GSC_CLIENT_SECRET 설정
 * 3. npx tsx scripts/gsc-auth.ts 실행
 * 4. 브라우저에서 인증 후 콘솔에 표시된 코드 입력
 * 5. 발급된 refresh_token을 GSC_REFRESH_TOKEN에 설정
 */

import { google } from 'googleapis';
import * as readline from 'readline';

const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
];

async function getRefreshToken() {
  const clientId = process.env.GSC_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('❌ GSC_CLIENT_ID and GSC_CLIENT_SECRET must be set in .env.local');
    console.log(`
📝 설정 방법:
1. https://console.cloud.google.com/ 접속
2. API 및 서비스 > 사용자 인증 정보
3. OAuth 2.0 클라이언트 ID 만들기
   - 애플리케이션 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI: http://localhost:3000/api/auth/callback/google
4. 클라이언트 ID와 클라이언트 보안 비밀번호 복사
5. .env.local에 추가:
   GSC_CLIENT_ID=your-client-id
   GSC_CLIENT_SECRET=your-client-secret
    `);
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'urn:ietf:wg:oauth:2.0:oob' // Out-of-band 리디렉션
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // 항상 refresh_token 발급
  });

  console.log('🔗 아래 URL을 브라우저에서 열고 Google 계정으로 로그인하세요:\n');
  console.log(authUrl);
  console.log('\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('✏️  인증 후 받은 코드를 입력하세요: ', async (code) => {
    rl.close();

    try {
      const { tokens } = await oauth2Client.getToken(code);

      console.log('\n✅ 토큰 발급 성공!\n');
      console.log('📋 .env.local에 아래 내용을 추가하세요:\n');
      console.log(`GSC_REFRESH_TOKEN=${tokens.refresh_token}`);

      if (tokens.access_token) {
        console.log(`\n(참고) Access Token: ${tokens.access_token?.substring(0, 20)}...`);
      }

      // 연결 테스트
      console.log('\n🔍 연결 테스트 중...');
      oauth2Client.setCredentials(tokens);

      const searchConsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
      const sites = await searchConsole.sites.list();

      if (sites.data.siteEntry && sites.data.siteEntry.length > 0) {
        console.log('\n✅ Google Search Console 연결 성공!');
        console.log('📊 등록된 사이트 목록:');
        sites.data.siteEntry.forEach((site, i) => {
          console.log(`  ${i + 1}. ${site.siteUrl} (${site.permissionLevel})`);
        });

        console.log('\n📋 GSC_SITE_URL도 설정하세요:');
        console.log(`GSC_SITE_URL=${sites.data.siteEntry[0].siteUrl}`);
      } else {
        console.log('\n⚠️ 등록된 사이트가 없습니다.');
        console.log('Google Search Console에서 사이트를 먼저 등록해주세요.');
      }

    } catch (error) {
      console.error('\n❌ 토큰 발급 실패:', error);
    }
  });
}

getRefreshToken();
