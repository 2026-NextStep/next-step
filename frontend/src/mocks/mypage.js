export const mockLocalUser = {
  userId: 1,
  username: 'nextstep_user',
  email: 'nextstep@example.com',
  name: '김신입',
  nickname: '취업도전자',
  phone: '010-1234-5678',
  birthDate: '1998-03-15',
  address: '서울특별시 강남구 테헤란로 123',
  addressDetail: '456동 789호',
  desiredJob: '백엔드 개발자',
  profileImage: null,
  provider: null,
  createdAt: '2025-12-01T10:30:00',
}

export const mockKakaoUser = {
  userId: 2,
  username: 'kakao_2398471234',
  email: null,
  name: '이카카오',
  nickname: '카카오유저',
  phone: null,
  birthDate: null,
  address: null,
  addressDetail: null,
  desiredJob: '프론트엔드 개발자',
  profileImage: 'https://k.kakaocdn.net/dn/sample/profile.jpg',
  provider: 'KAKAO',
  providerId: '2398471234',
  createdAt: '2025-12-15T14:20:00',
}

export const mockUser = mockLocalUser

export const mockActivityCount = {
  bookmarkCount: 24,
  aiAnalysisCount: 12,
  favoritePostCount: 156,
  contractCount: 45,
}

export const mockBookmarkedPostings = [
  {
    postingId: 1,
    companyName: '네이버웹툰',
    title: '2024년 하반기 신입/경력 프론트엔드 개발자 채용',
    location: '판교',
    employmentType: '정규직',
    careerLevel: '신입·경력',
    dDay: 5,
    isAlwaysRecruiting: false,
  },
  {
    postingId: 2,
    companyName: '토스뱅크',
    title: '서버 엔지니어 (Node.js) 대규모 채용',
    location: '서울 강남구',
    employmentType: '정규직',
    careerLevel: '신입',
    dDay: 12,
    isAlwaysRecruiting: false,
  },
  {
    postingId: 3,
    companyName: '당근마켓',
    title: '프로덕트 디자이너 (신입) 모집',
    location: '서울 서초구',
    employmentType: '정규직',
    careerLevel: '신입',
    dDay: null,
    isAlwaysRecruiting: true,
  },
]

export const mockAIAnalysisPostings = [
  {
    postingId: 4,
    companyName: '카카오뱅크',
    title: '데이터 분석가(Data Analyst) 영입',
    location: '판교',
    employmentType: '정규직',
    careerLevel: '신입·경력',
    dDay: 3,
    isAlwaysRecruiting: false,
  },
  {
    postingId: 5,
    companyName: '우아한형제들',
    title: 'B2B 서비스 기획자 채용',
    location: '서울 송파구',
    employmentType: '정규직',
    careerLevel: '신입',
    dDay: 15,
    isAlwaysRecruiting: false,
  },
]

export const mockFavoritePosts = [
  {
    postId: 1,
    title: '신입 프론트엔드 개발자 이력서 피드백 부탁드립니다.',
    category: '멘토링',
    authorNickname: '김멘토',
    createdAt: '2024.05.12',
    likeCount: 24,
    commentCount: 12,
  },
  {
    postId: 2,
    title: '스타트업 연봉 협상 팁 공유합니다.',
    category: '자유게시판',
    authorNickname: '취업왕',
    createdAt: '2024.05.10',
    likeCount: 156,
    commentCount: 45,
  },
]