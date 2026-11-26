import type { Lang } from './i18n/ui';

type SiteText = {
  name: string;
  tagline: string;
  description: string;
  institution: string;
  address?: string[];
  about: string[];   // home page "About", one string per paragraph
  join: {            // the "Join us" page (/join)
    intro: string;
    lookFor: string[];     // "What we look for", one string per paragraph
    inquiries?: string[];  // inquiries and funding opportunities
    documents?: string[];  // documents and information every application should include
  };
};

// Edit group-wide information here. Interface labels (menu, buttons, headings)
// are translated in src/i18n/ui.ts.
export const site: SiteText & {
  shortName: string;
  address: string[];
  email: string;
  github?: string;
  nav: { key: 'nav.research' | 'nav.people' | 'nav.publications' | 'nav.software' | 'nav.news' | 'nav.jobs'; href: string }[];
  translations?: Partial<Record<Lang, Partial<SiteText>>>;
} = {
  name: 'System Optimization Group',
  shortName: 'SOG',
  tagline: 'Computational Optimization, Automatic Reasoning, and Machine Learning.',
  description:
    'We develop mathematical optimization methods for decision making in complex systems, artificial intelligence, and open-ended environments.',
  institution: 'The Hong Kong Polytechnic University',
  about: [
    'The System Optimization Group develops mathematical optimization methods for decision making in complex systems, artificial intelligence, and open-ended environments. Our work spans mixed-integer programming, optimization software, formal methods, and machine learning. Our mission is to make optimization technology verifiable, robust, and reproducible for critical infrastructures.',
    'We are part of the Department of Applied Mathematics within the Faculty of Computer and Mathematical Sciences at The Hong Kong Polytechnic University and collaborate with partners in academia and industry.',
  ],
  join: {
    intro:
      'We are always seeking new members with various backgrounds to join our group and work on research projects spanning different topics!',
    lookFor: [
      'Our work demands a robust theoretical foundation and analytical skills in mathematical optimization and/or machine learning. Strong experimental skills and systematic thinking are highly desirable.',
      'English is widely spoken in Hong Kong. We welcome interest from students and researchers worldwide for the various positions in our group.',
    ],
    inquiries: [
      'We review inquiries on a rolling basis. Although we cannot offer an open position or guaranteed funding for every inquiry, we explore various funding sources case by case and work with promising candidates to identify suitable opportunities. If we are unable to reply in time, it is usually because no positions are currently open.',
      'We advise all candidates to contact us at least 3 months prior to your preferred start time; for international applicants who require a working visa in Hong Kong, please reach out at least 3–6 months before your ideal start date. Note that securing funding may take some time, and yearly fellowship applications have hard deadlines set by the university.',
    ],
  },
  address: ['11 Yuk Choi Road, Hung Hom, Kowloon', 'Hong Kong'],
  email: 'group@example.org',
  github: 'https://github.com/your-org',
  nav: [
    { key: 'nav.research', href: '/research' },
    { key: 'nav.people', href: '/people' },
    { key: 'nav.publications', href: '/publications' },
    { key: 'nav.software', href: '/software' },
    { key: 'nav.news', href: '/news' },
  ],

  // Optional translations of the texts above. Anything left out falls back to English.
  translations: {
    'zh-hans': {
      name: '系统优化课题组',
      tagline: '计算优化、自动推理与机器学习。',
      description: '我们致力于为复杂系统、人工智能与开放式环境中的决策制定开发数学优化方法。',
      institution: '香港理工大学',
      address: ['九龙红磡育才道11号', '香港'],
      about: [
        '系统优化课题组致力于为复杂系统、人工智能与开放式环境中的决策制定开发数学优化方法。我们的研究涵盖混合整数规划、优化软件、形式化方法与机器学习。我们的使命是使优化技术在关键基础设施中更加可验证、鲁棒且可复现。',
        '我们隶属于香港理工大学计算机及数学科学学院应用数学系，并与学术界及工业界的伙伴广泛开展合作。',
      ],
      join: {
        intro: '我们始终欢迎具有不同学术背景的新成员加入课题组，开展涵盖多领域的科研项目！',
        lookFor: [
          '我们的研究需要扎实的数学优化和/或机器学习理论基础与分析能力。具备较强的实验动手能力与系统性思维者尤佳。',
          '英语在香港广泛使用。我们诚挚欢迎世界各地的学生与学者咨询和申请各类职位。',
        ],
        inquiries: [
          '我们常年接受并滚动审阅各类申请与咨询。虽然我们无法为每一位申请者提供现成的空缺职位或全额资助，但我们会根据具体情况探索多种资助途径，并与有潜力的候选人共同发掘合适的资助机会。若未能及时回复，通常是因为目前没有开放的职位。',
          '建议所有候选人至少在期望入职时间前 3 个月与我们联系；需要办理香港工作签证的国际申请者，请至少提前 3 至 6 个月接洽。请注意，争取资助需要一定周期，且大学各项年度奖学金申请均有严格的截止日期。',
        ],
      },
    },
    'zh-hant': {
      name: '系統優化研究組',
      tagline: '計算優化、自動推理與機器學習。',
      description: '我們致力為複雜系統、人工智能及開放式環境中的決策制定開發數學優化方法。',
      institution: '香港理工大學',
      address: ['九龍紅磡育才道11號', '香港'],
      about: [
        '系統優化研究組致力為複雜系統、人工智能及開放式環境中的決策制定開發數學優化方法。我們的工作涵蓋混合整數規劃、優化軟件、形式化方法與機器學習。我們的使命是使優化技術在關鍵基礎設施中更加可驗證、穩健且可復現。',
        '我們隸屬香港理工大學計算機及數學科學學院應用數學系，並與學術界及業界夥伴合作。',
      ],
      join: {
        intro: '我們一直歡迎具備不同學術背景的新成員加入研究組，開展涵蓋多個範疇的研究項目！',
        lookFor: [
          '我們的工作需要紮實的數學優化及／或機器學習理論基礎與分析能力。具備良好實驗技能與系統性思維者尤佳。',
          '英語在香港廣泛使用。我們誠摯歡迎世界各地的學生及研究人員諮詢及申請各類職位。',
        ],
        inquiries: [
          '我們全年滾動審閱各類申請與諮詢。雖然我們未必能為每位申請人提供現成空缺或保證資助，但我們會因應個別情況探討多種資助來源，並與具潛力的候選人共同發掘合適的資助機會。若未能及時回覆，通常是因為目前沒有開放的職位。',
          '我們建議所有候選人至少在預期入職前 3 個月與我們聯絡；需要辦理香港工作簽證的國際申請人，請至少提前 3 至 6 個月接洽。請注意，落實資助需時，且大學各項年度獎學金申請均設有嚴格截止日期。',
        ],
      },
    },
  },
};

/** Member roles in display order (labels are in src/i18n/ui.ts as role.<id>). */
export const roleOrder = ['pi', 'postdoc', 'phd', 'ra', 'master', 'staff', 'alumni'] as const;

/** Roles whose section is shown on the People page even when nobody is listed yet. */
export const alwaysShowRoles: readonly (typeof roleOrder)[number][] = ['pi', 'postdoc', 'phd', 'ra', 'alumni'];
