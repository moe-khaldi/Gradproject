import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, BookOpen, MessageSquare, FileText, Brain, Moon, Sun, Menu, X, ChevronRight, Home, Settings, User, LogOut, Check, AlertCircle, Sparkles, Code, Database, Lightbulb, Target, FileQuestion, BarChart3, Loader } from 'lucide-react';
import api from "./api";
import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';

// Design System Constants
const COLORS = {
  light: {
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceHover: '#F5F5F5',
    border: '#E5E5E5',
    text: '#1A1A1A',
    textSecondary: '#666666',
    textTertiary: '#999999',
    primary: '#2D5F8D',
    primaryHover: '#234B71',
    primaryLight: '#E8EFF5',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    accent: '#8B5CF6',
    codeBlock: '#F8F9FA',
  },
  dark: {
    bg: '#0A0A0A',
    surface: '#1A1A1A',
    surfaceHover: '#242424',
    border: '#2A2A2A',
    text: '#E5E5E5',
    textSecondary: '#A3A3A3',
    textTertiary: '#666666',
    primary: '#4A90C9',
    primaryHover: '#5BA3DC',
    primaryLight: '#1E2A35',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    accent: '#A78BFA',
    codeBlock: '#151515',
  }
};

// Main App Component
export default function AITeachingSystem() {
  const { user, logout: authLogout, isAuthenticated } = useAuth();
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [currentSubject, setCurrentSubject] = useState('oop');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [quizData, setQuizData] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const colors = COLORS[theme];
  const isRTL = language === 'ar';

  const subjects = {
    oop: {
      name: { en: 'Object-Oriented Programming', ar: 'البرمجة الكينونية' },
      icon: Code,
      topics: [
        { id: 1, name: { en: 'Classes and Objects', ar: 'الفئات والكيان' } },
        { id: 2, name: { en: 'Inheritance', ar: 'الوراثة' } },
        { id: 3, name: { en: 'Polymorphism', ar: 'تعدد الأشكال' } },
        { id: 4, name: { en: 'Encapsulation', ar: 'التغليف' } },
        { id: 5, name: { en: 'Abstraction', ar: 'التجريد' } },
      ]
    },
    ds: {
      name: { en: 'Data Structures', ar: 'تراكيب البيانات' },
      icon: Database,
      topics: [
        { id: 1, name: { en: 'Arrays and Lists', ar: 'المصفوفات والقوائم' } },
        { id: 2, name: { en: 'Stacks and Queues', ar: 'المكدسات والطوابير' } },
        { id: 3, name: { en: 'Trees', ar: 'الأشجار' } },
        { id: 4, name: { en: 'Graphs', ar: 'الرسوم البيانية' } },
        { id: 5, name: { en: 'Hash Tables', ar: 'جداول التجزئة' } },
      ]
    }
  };

  const translations = {
    en: {
      appName: 'AI Teaching System',
      tagline: 'Master Computer Science with AI',
      chatTutor: 'Chat Tutor',
      quizGenerator: 'Quiz Generator',
      uploadExplain: 'Upload & Explain',
      subjects: 'Subjects',
      savedSessions: 'Saved Sessions',
      materials: 'Materials',
      typeMessage: 'Ask me anything about',
      explainSimply: 'Explain Simply',
      giveExample: 'Give Example',
      generateQuiz: 'Generate Quiz',
      practiceProblems: 'Practice Problems',
      summarize: 'Summarize',
      login: 'Login',
      signup: 'Sign Up',
      logout: 'Logout',
      settings: 'Settings',
      welcomeTitle: 'Learn CS with AI',
      welcomeSubtitle: 'Your personal AI tutor for OOP and Data Structures',
      getStarted: 'Get Started',
      tryWithoutAccount: 'Try without account',
      features: 'Features',
      interactiveTutor: 'Interactive AI Tutor',
      instantQuizzes: 'Instant Quizzes',
      slideExplanation: 'Slide Explanation',
      uploadFile: 'Upload File',
      pasteContent: 'Paste Content',
      submit: 'Submit',
      score: 'Score',
      nextTopic: 'Next Recommended Topic',
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      backendConnected: 'Backend Connected',
      backendDisconnected: 'Backend Disconnected',
    },
    ar: {
      appName: 'نظام التعليم بالذكاء الاصطناعي',
      tagline: 'أتقن علوم الحاسوب مع الذكاء الاصطناعي',
      chatTutor: 'المعلم الذكي',
      quizGenerator: 'منشئ الاختبارات',
      uploadExplain: 'رفع وشرح',
      subjects: 'المواد',
      savedSessions: 'الجلسات المحفوظة',
      materials: 'المواد التعليمية',
      typeMessage: 'اسألني أي شيء ',
      explainSimply: 'اشرح ببساطة',
      giveExample: 'أعطِ مثالاً',
      generateQuiz: 'إنشاء اختبار',
      practiceProblems: 'تمارين تطبيقية',
      summarize: 'لخص',
      login: 'تسجيل الدخول',
      signup: 'إنشاء حساب',
      logout: 'تسجيل الخروج',
      settings: 'الإعدادات',
      welcomeTitle: 'تعلم علوم الحاسوب مع الذكاء الاصطناعي',
      welcomeSubtitle: 'معلمك الشخصي للبرمجة الكينونية وهياكل البيانات',
      getStarted: 'ابدأ الآن',
      tryWithoutAccount: 'جرب بدون حساب',
      features: 'المميزات',
      interactiveTutor: 'معلم ذكي تفاعلي',
      instantQuizzes: 'اختبارات فورية',
      slideExplanation: 'شرح الشرائح',
      uploadFile: 'رفع ملف',
      pasteContent: 'لصق المحتوى',
      submit: 'إرسال',
      score: 'النتيجة',
      nextTopic: 'الموضوع التالي الموصى به',
      loading: 'جاري التحميل...',
      error: 'خطأ',
      retry: 'إعادة المحاولة',
      backendConnected: 'متصل بالخادم',
      backendDisconnected: 'غير متصل بالخادم',
    }
  };

  const t = translations[language];

  // Load materials from Django backend on mount
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMaterials();
      setMaterials(data);
      console.log('✅ Materials loaded from Django:', data);
    } catch (err) {
      console.error('❌ Failed to load materials:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send message to Django AI backend
  const handleSendMessage = async (message, actionType = null) => {
    if (!message.trim() && !actionType) return;

    const userMessage = {
      role: 'user',
      content: message || actionType,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Try to call Django backend
      const response = await api.sendMessage(
        message || actionType,
        currentSubject,
        { actionType, language }
      );

      const aiResponse = {
        role: 'assistant',
        content: response.response || response.message,
        timestamp: new Date().toISOString(),
        references: response.references || null
      };

      setMessages(prev => [...prev, aiResponse]);

      // Handle special actions
      if (actionType === 'quiz' || response.quiz) {
        setQuizData(response.quiz);
        setShowRightPanel(true);
        setRightPanelContent('quiz');
      } else if (actionType === 'example' || response.example) {
        setShowRightPanel(true);
        setRightPanelContent('example');
      }

    } catch (err) {
      console.error('❌ Backend call failed, using fallback:', err);
      
      // Fallback to simulated response if backend is not available
      const aiResponse = {
        role: 'assistant',
        content: generateFallbackResponse(message, actionType, currentSubject),
        timestamp: new Date().toISOString(),
        references: actionType === 'explain' ? ['Computer Science Textbook, Ch. 4', 'GeeksforGeeks OOP Tutorial'] : null,
        fallback: true
      };
      
      setMessages(prev => [...prev, aiResponse]);

      if (actionType === 'quiz') {
        generateFallbackQuiz();
      } else if (actionType === 'example') {
        setShowRightPanel(true);
        setRightPanelContent('example');
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Fallback response generator (when backend is unavailable)
  const generateFallbackResponse = (message, actionType, subject) => {
    if (actionType === 'explain') {
      return `Let me explain this concept in simple terms:\n\nIn ${subject === 'oop' ? 'Object-Oriented Programming' : 'Data Structures'}, ${message ? message : 'this topic'} is fundamental to understanding how we organize and structure code.\n\n**Key Points:**\n1. The main idea revolves around creating reusable and maintainable code\n2. It helps in managing complexity in large software systems\n3. Real-world applications use these concepts extensively\n\n⚠️ Note: Using fallback mode. Connect to Django backend for AI-powered responses.\n\nWould you like me to provide a concrete example or generate practice questions?`;
    } else if (actionType === 'example') {
      return `Here's a practical example:\n\n\`\`\`python\nclass Student:\n    def __init__(self, name, id):\n        self.name = name\n        self.id = id\n        self.courses = []\n    \n    def enroll(self, course):\n        self.courses.append(course)\n        print(f"{self.name} enrolled in {course}")\n\n# Create a student object\nstudent1 = Student("Ahmad", "20210001")\nstudent1.enroll("Data Structures")\n\`\`\`\n\nThis demonstrates encapsulation by keeping student data and methods together.\n\n⚠️ Using fallback mode. Connect Django backend for personalized examples.`;
    } else if (actionType === 'quiz') {
      return `I've generated a quiz for you! Check the panel on the right to start practicing.\n\n⚠️ Using fallback mode. Connect to Django for dynamic quiz generation.`;
    } else if (actionType === 'practice') {
      return `Here are some practice problems:\n\n**Problem 1:** Implement a class hierarchy for different types of vehicles.\n\n**Problem 2:** Create a linked list and implement insert and delete operations.\n\n**Problem 3:** Design a system to manage a library using OOP principles.\n\n⚠️ Using fallback mode.`;
    } else if (actionType === 'summarize') {
      return `**Summary:**\n\n✓ Classes are blueprints for creating objects\n✓ Objects are instances of classes\n✓ Inheritance allows code reuse\n✓ Polymorphism enables flexible code\n✓ Encapsulation protects data\n\n⚠️ Using fallback mode.`;
    }
    return `I understand you're asking about: "${message}"\n\nThis is an important concept in ${subject === 'oop' ? 'Object-Oriented Programming' : 'Data Structures'}. Let me break it down:\n\nThe core principle here involves understanding how data and operations are organized. In practical applications, this helps developers create more efficient and maintainable software systems.\n\n⚠️ Note: Using fallback mode. Connect to Django backend at http://localhost:8000 for AI-powered responses.\n\nWould you like me to:\n• Explain this more simply\n• Provide a code example\n• Generate practice questions`;
  };

  const generateFallbackQuiz = () => {
    const quiz = {
      questions: [
        {
          id: 1,
          type: 'multiple',
          question: 'What is the main purpose of encapsulation in OOP?',
          options: [
            'To hide implementation details',
            'To create multiple objects',
            'To inherit properties',
            'To override methods'
          ],
          correct: 0,
          explanation: 'Encapsulation is about bundling data and methods that operate on that data, hiding internal implementation details from the outside world.'
        },
        {
          id: 2,
          type: 'boolean',
          question: 'A class can inherit from multiple parent classes in Java.',
          correct: false,
          explanation: 'Java does not support multiple inheritance with classes to avoid the diamond problem. However, it supports multiple inheritance through interfaces.'
        },
        {
          id: 3,
          type: 'short',
          question: 'Define polymorphism in your own words.',
          sampleAnswer: 'Polymorphism is the ability of different objects to respond to the same message or method call in different ways.'
        }
      ],
      fallback: true
    };
    setQuizData(quiz);
    setShowRightPanel(true);
    setRightPanelContent('quiz');
  };

  // Generate quiz via Django backend
  const generateQuiz = async (config = {}) => {
    try {
      setLoading(true);
      const quizConfig = {
        ...config,
        subject: currentSubject,
        topic: config.topic || 'General',
        num_questions: config.numQuestions || 5,
        difficulty: config.difficulty || 'medium',
        types: config.types || ['multiple', 'boolean', 'short'],
        
      };

      const response = await api.generateQuiz(quizConfig);
      setQuizData(response);
      setShowRightPanel(true);
      setRightPanelContent('quiz');
      setCurrentPage('chat');
      console.log('✅ Quiz generated from Django:', response);
    } catch (err) {
      console.error('❌ Quiz generation failed, using fallback:', err);
      generateFallbackQuiz();
      setCurrentPage('chat');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload to Django
  const handleFileUpload = async (file) => {
    try {
      setLoading(true);
      const response = await api.uploadFile(file, {
        subject: currentSubject,
        topic: 'File Upload'
      });

      setCurrentPage('chat');
      const message = {
        role: 'assistant',
        content: response.explanation || response.message,
        timestamp: new Date().toISOString(),
        references: response.references
      };
      setMessages(prev => [...prev, message]);
      
      console.log('✅ File uploaded and explained:', response);
    } catch (err) {
      console.error('❌ File upload failed:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigation Component
  const Sidebar = () => (
    <div
      className="sidebar"
      style={{
        width: sidebarOpen ? '260px' : '0',
        background: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        height: '100vh',
        position: 'fixed',
        left: isRTL ? 'auto' : 0,
        right: isRTL ? 0 : 'auto',
        top: 0,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Brain size={28} color={colors.primary} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>
              {t.appName.split(' ')[0]}
            </div>
            <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
              {t.tagline}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        <NavItem icon={Home} label={t.appName.split(' ').slice(0, 2).join(' ')} onClick={() => setCurrentPage('home')} active={currentPage === 'home'} />
        <NavItem icon={MessageSquare} label={t.chatTutor} onClick={() => setCurrentPage('chat')} active={currentPage === 'chat'} />
        <NavItem icon={FileQuestion} label={t.quizGenerator} onClick={() => setCurrentPage('quiz')} active={currentPage === 'quiz'} />
        <NavItem icon={Upload} label={t.uploadExplain} onClick={() => setCurrentPage('upload')} active={currentPage === 'upload'} />
        
        <div style={{ padding: '20px 20px 8px', fontSize: '11px', fontWeight: 600, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {t.subjects}
        </div>
        {Object.entries(subjects).map(([key, subject]) => (
          <NavItem
            key={key}
            icon={subject.icon}
            label={subject.name[language]}
            onClick={() => {
              setCurrentSubject(key);
              setCurrentPage('chat');
            }}
            active={currentSubject === key && currentPage === 'chat'}
            indent
          />
        ))}

        {/* Materials from Django */}
        {materials.length > 0 && (
          <>
            <div style={{ padding: '20px 20px 8px', fontSize: '11px', fontWeight: 600, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t.materials} ({materials.length})
            </div>
            {materials.slice(0, 5).map((material) => (
              <NavItem
                key={material.id}
                icon={BookOpen}
                label={material.title}
                onClick={() => {
                  console.log('Material clicked:', material);
                  setCurrentPage('chat');
                  handleSendMessage(`Tell me about ${material.title}`, 'explain');
                }}
                indent
              />
            ))}
          </>
        )}

        {isAuthenticated && (
          <>
            <div style={{ padding: '20px 20px 8px', fontSize: '11px', fontWeight: 600, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t.savedSessions}
            </div>
            <NavItem icon={BookOpen} label="Session 1 - OOP Basics" indent />
            <NavItem icon={BookOpen} label="Session 2 - Trees" indent />
          </>
        )}
      </div>

      {/* Backend Status Indicator */}
      <div style={{
        padding: '8px 20px',
        borderTop: `1px solid ${colors.border}`,
        fontSize: '11px',
        color: error ? colors.error : colors.success,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: error ? colors.error : colors.success,
        }} />
        {error ? t.backendDisconnected : t.backendConnected}
      </div>

      {/* User Section */}
      <div style={{ padding: '16px', borderTop: `1px solid ${colors.border}` }}>
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>{user?.first_name} {user?.last_name}</div>
              <div style={{ fontSize: '12px', color: colors.textSecondary }}>{user?.email}</div>
            </div>
            <button
              onClick={() => {
                authLogout();
                setShowLoginPage(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: colors.textSecondary
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLoginPage(true)}
            style={{
              width: '100%',
              padding: '10px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t.login}
          </button>
        )}
      </div>
    </div>
  );

  const NavItem = ({ icon: Icon, label, onClick, active, indent }) => (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 20px',
        paddingLeft: indent ? '40px' : '20px',
        paddingRight: isRTL ? (indent ? '40px' : '20px') : '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: active ? colors.primaryLight : 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: active ? 600 : 400,
        color: active ? colors.primary : colors.text,
        textAlign: isRTL ? 'right' : 'left',
        transition: 'all 0.2s',
        borderLeft: active && !isRTL ? `3px solid ${colors.primary}` : 'none',
        borderRight: active && isRTL ? `3px solid ${colors.primary}` : 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = colors.surfaceHover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <Icon size={18} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );

  // Top Navigation Bar
  const TopBar = () => (
    <div style={{
      height: '64px',
      background: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '16px',
      position: 'fixed',
      top: 0,
      left: isRTL ? 0 : (sidebarOpen ? '260px' : 0),
      right: isRTL ? (sidebarOpen ? '260px' : 0) : 0,
      zIndex: 90,
      transition: 'left 0.3s ease, right 0.3s ease',
    }}>
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          color: colors.text,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: colors.textSecondary
        }}>
          <Loader size={16} className="spinner" />
          {t.loading}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Language Toggle */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        style={{
          padding: '8px 16px',
          background: colors.surfaceHover,
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          color: colors.text
        }}
      >
        {language === 'en' ? 'العربية' : 'English'}
      </button>

      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        style={{
          padding: '8px',
          background: colors.surfaceHover,
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          color: colors.text
        }}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      {!isAuthenticated && (
        <button
          onClick={() => setShowLoginPage(true)}
          style={{
            padding: '8px 16px',
            background: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          {t.login}
        </button>
      )}
    </div>
  );

  // Home Page
  const HomePage = () => (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      textAlign: 'center',
      background: `linear-gradient(135deg, ${colors.bg} 0%, ${theme === 'light' ? '#E8EFF5' : '#151515'} 100%)`
    }}>
      <div style={{
        background: colors.primary,
        width: '80px',
        height: '80px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }}>
        <Brain size={40} color="white" />
      </div>

      <h1 style={{
        fontSize: '48px',
        fontWeight: 800,
        color: colors.text,
        marginBottom: '16px',
        lineHeight: 1.2
      }}>
        {t.welcomeTitle}
      </h1>

      <p style={{
        fontSize: '20px',
        color: colors.textSecondary,
        maxWidth: '600px',
        marginBottom: '40px'
      }}>
        {t.welcomeSubtitle}
      </p>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '60px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => setCurrentPage('chat')}
          style={{
            padding: '16px 32px',
            background: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {t.getStarted}
          <ChevronRight size={20} />
        </button>

        {!isAuthenticated && (
          <button
            onClick={() => setCurrentPage('chat')}
            style={{
              padding: '16px 32px',
              background: 'transparent',
              color: colors.text,
              border: `2px solid ${colors.border}`,
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t.tryWithoutAccount}
          </button>
        )}
      </div>

      {/* Django Backend Status */}
      {materials.length > 0 && (
        <div style={{
          padding: '16px 24px',
          background: colors.success + '15',
          border: `1px solid ${colors.success}`,
          borderRadius: '12px',
          marginBottom: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          color: colors.success,
          fontWeight: 600
        }}>
          <Check size={20} />
          Django Backend Connected • {materials.length} materials loaded
        </div>
      )}

      {error && (
        <div style={{
          padding: '16px 24px',
          background: colors.warning + '15',
          border: `1px solid ${colors.warning}`,
          borderRadius: '12px',
          marginBottom: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          color: colors.warning,
          fontWeight: 600
        }}>
          <AlertCircle size={20} />
          Running in demo mode • Start Django backend at http://localhost:8000
          <button
            onClick={loadMaterials}
            style={{
              marginLeft: '12px',
              padding: '6px 12px',
              background: colors.warning,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t.retry}
          </button>
        </div>
      )}

      {/* Feature Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        maxWidth: '1000px',
        width: '100%'
      }}>
        <FeatureCard
          icon={MessageSquare}
          title={t.interactiveTutor}
          description="Get personalized explanations and step-by-step guidance"
          color={colors.primary}
        />
        <FeatureCard
          icon={FileQuestion}
          title={t.instantQuizzes}
          description="Generate practice quizzes and get instant feedback"
          color={colors.accent}
        />
        <FeatureCard
          icon={Upload}
          title={t.slideExplanation}
          description="Upload lecture slides and get detailed explanations"
          color={colors.success}
        />
      </div>
    </div>
  );

  const FeatureCard = ({ icon: Icon, title, description, color }) => (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '16px',
      padding: '32px',
      textAlign: 'center',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div style={{
        width: '56px',
        height: '56px',
        background: `${color}15`,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px'
      }}>
        <Icon size={28} color={color} />
      </div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 700,
        color: colors.text,
        marginBottom: '8px'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '14px',
        color: colors.textSecondary,
        lineHeight: 1.6
      }}>
        {description}
      </p>
    </div>
  );

  // Chat Tutor Page (same as before, but now integrated with backend)
  const ChatPage = () => {
    const messagesEndRef = useRef(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 64px)' }}>
        {/* Main Chat Area */}
        <div style={{
          flex: showRightPanel ? '1 1 60%' : 1,
          display: 'flex',
          flexDirection: 'column',
          background: colors.bg
        }}>
          {/* Subject Header */}
          <div style={{
            padding: '20px 24px',
            background: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {React.createElement(subjects[currentSubject].icon, { size: 24, color: colors.primary })}
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: colors.text }}>
                {subjects[currentSubject].name[language]}
              </div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '2px' }}>
                {isAuthenticated ? 'Full access' : 'Limited mode - Login for full features'}
                {error && ' • Demo Mode'}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {messages.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '40px'
              }}>
                <Sparkles size={48} color={colors.textTertiary} style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>
                  Start Learning {subjects[currentSubject].name.en}
                </h3>
                <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '24px', maxWidth: '400px' }}>
                  Ask me anything about the topics, request examples, or generate practice quizzes
                </p>

                {/* Topic Suggestions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '500px' }}>
                  {subjects[currentSubject].topics.slice(0, 3).map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => handleSendMessage(`Explain ${topic.name.en}`, 'explain')}
                      style={{
                        padding: '8px 16px',
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '20px',
                        fontSize: '13px',
                        color: colors.text,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.surfaceHover;
                        e.currentTarget.style.borderColor = colors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = colors.surface;
                        e.currentTarget.style.borderColor = colors.border;
                      }}
                    >
                      {topic.name.en}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <MessageBubble key={index} message={message} />
                ))}
                {isTyping && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Brain size={20} color="white" />
                    </div>
                    <div style={{
                      padding: '12px 16px',
                      background: colors.surface,
                      borderRadius: '12px',
                      border: `1px solid ${colors.border}`
                    }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <div className="typing-dot" style={{ width: '8px', height: '8px', background: colors.textTertiary, borderRadius: '50%', animation: 'typing 1.4s infinite' }} />
                        <div className="typing-dot" style={{ width: '8px', height: '8px', background: colors.textTertiary, borderRadius: '50%', animation: 'typing 1.4s infinite 0.2s' }} />
                        <div className="typing-dot" style={{ width: '8px', height: '8px', background: colors.textTertiary, borderRadius: '50%', animation: 'typing 1.4s infinite 0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            padding: '16px 24px',
            background: colors.surface,
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            overflowX: 'auto'
          }}>
            <ActionButton icon={Lightbulb} label={t.explainSimply} onClick={() => handleSendMessage('', 'explain')} />
            <ActionButton icon={Code} label={t.giveExample} onClick={() => handleSendMessage('', 'example')} />
            <ActionButton icon={FileQuestion} label={t.generateQuiz} onClick={() => handleSendMessage('', 'quiz')} />
            <ActionButton icon={Target} label={t.practiceProblems} onClick={() => handleSendMessage('', 'practice')} />
            <ActionButton icon={BarChart3} label={t.summarize} onClick={() => handleSendMessage('', 'summarize')} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '16px 24px 24px',
            background: colors.surface,
            borderTop: `1px solid ${colors.border}`
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              background: colors.bg,
              border: `2px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '12px',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = colors.primary}
            onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                placeholder={`${t.typeMessage} ${subjects[currentSubject].name[language]}`}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  color: colors.text,
                  direction: isRTL ? 'rtl' : 'ltr'
                }}
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim()}
                style={{
                  padding: '8px 16px',
                  background: inputValue.trim() ? colors.primary : colors.surfaceHover,
                  color: inputValue.trim() ? 'white' : colors.textTertiary,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        {showRightPanel && (
          <div style={{
            flex: '0 0 40%',
            borderLeft: `1px solid ${colors.border}`,
            background: colors.surface,
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '500px'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.text }}>
                {rightPanelContent === 'quiz' ? 'Practice Quiz' : 'Code Example'}
              </h3>
              <button
                onClick={() => setShowRightPanel(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: colors.textSecondary
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {rightPanelContent === 'quiz' && quizData && <QuizDisplay quiz={quizData} />}
              {rightPanelContent === 'example' && <ExampleDisplay />}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMarkdown = (text) => {
    if (!text) return null;

    // Split by code blocks first
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, partIndex) => {
      // Handle code blocks
      if (part.startsWith('```')) {
        const lines = part.slice(3, -3).split('\n');
        const language = lines[0].trim();
        const code = lines.slice(language ? 1 : 0).join('\n');
        return (
          <pre key={partIndex} style={{
            background: colors.codeBlock,
            padding: '12px',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '13px',
            fontFamily: 'monospace',
            margin: '8px 0',
            border: `1px solid ${colors.border}`
          }}>
            <code>{code}</code>
          </pre>
        );
      }

      // Process regular text with inline formatting
      const lines = part.split('\n');
      return lines.map((line, lineIndex) => {
        // Headers
        if (line.startsWith('### ')) {
          return <div key={`${partIndex}-${lineIndex}`} style={{ fontWeight: 700, fontSize: '15px', marginTop: '12px', marginBottom: '4px' }}>{line.slice(4)}</div>;
        }
        if (line.startsWith('## ')) {
          return <div key={`${partIndex}-${lineIndex}`} style={{ fontWeight: 700, fontSize: '16px', marginTop: '14px', marginBottom: '6px' }}>{line.slice(3)}</div>;
        }
        if (line.startsWith('# ')) {
          return <div key={`${partIndex}-${lineIndex}`} style={{ fontWeight: 800, fontSize: '18px', marginTop: '16px', marginBottom: '8px' }}>{line.slice(2)}</div>;
        }

        // Bullet points
        if (line.match(/^[\*\-]\s/)) {
          return <div key={`${partIndex}-${lineIndex}`} style={{ paddingLeft: '16px' }}>• {line.slice(2)}</div>;
        }
        if (line.match(/^\d+\.\s/)) {
          return <div key={`${partIndex}-${lineIndex}`} style={{ paddingLeft: '16px' }}>{line}</div>;
        }

        // Bold and italic (simple replace)
        let processed = line
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, `<code style="background:${colors.codeBlock};padding:2px 4px;border-radius:3px;font-family:monospace;border:1px solid ${colors.border}">$1</code>`);

        // Horizontal rule
        if (line.match(/^---+$/)) {
          return <hr key={`${partIndex}-${lineIndex}`} style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: '12px 0' }} />;
        }

        // Empty line
        if (!line.trim()) {
          return <div key={`${partIndex}-${lineIndex}`} style={{ height: '8px' }} />;
        }

        // Regular text with inline HTML
        return <div key={`${partIndex}-${lineIndex}`} dangerouslySetInnerHTML={{ __html: processed }} />;
      });
    });
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    return (
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: isUser ? colors.primary : colors.surface,
          border: isUser ? 'none' : `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {isUser ? (
            <User size={20} color="white" />
          ) : (
            <Brain size={20} color={colors.primary} />
          )}
        </div>
        <div style={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{
            padding: '12px 16px',
            background: isUser ? colors.primary : colors.surface,
            color: isUser ? 'white' : colors.text,
            borderRadius: '12px',
            border: isUser ? 'none' : `1px solid ${colors.border}`,
            fontSize: '14px',
            lineHeight: 1.6
          }}>
            {isUser ? message.content : renderMarkdown(message.content)}
          </div>
          {message.fallback && (
            <div style={{
              fontSize: '11px',
              color: colors.warning,
              padding: '6px 10px',
              background: colors.warning + '15',
              borderRadius: '6px',
              border: `1px solid ${colors.warning}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertCircle size={12} />
              Demo mode - Connect Django for AI responses
            </div>
          )}
          {message.references && (
            <div style={{
              fontSize: '12px',
              color: colors.textSecondary,
              padding: '8px 12px',
              background: colors.surfaceHover,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>References:</div>
              {message.references.map((ref, i) => (
                <div key={i}>• {ref}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const ActionButton = ({ icon: Icon, label, onClick }) => (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '8px 14px',
        background: colors.surfaceHover,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: 500,
        color: colors.text,
        transition: 'all 0.2s',
        opacity: loading ? 0.5 : 1
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.background = colors.primary;
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.borderColor = colors.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.background = colors.surfaceHover;
          e.currentTarget.style.color = colors.text;
          e.currentTarget.style.borderColor = colors.border;
        }
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  // Quiz Display Component
  const QuizDisplay = ({ quiz }) => {
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const quizId = quiz.quiz_id || quiz.id;
    const questions = quiz.questions || [];

    const normalizeQuestion = (q) => {
      let type = q.type;
      if (type === 'multiple_choice') type = 'multiple';
      if (type === 'true_false' || type === 'boolean') type = 'boolean';
      if (type === 'short_answer') type = 'short';

      let correct = q.correct;
      if (q.correct_answer !== undefined) {
        const letterToIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        correct = letterToIndex[q.correct_answer?.toUpperCase()] ?? q.correct_answer;
      }

      return { ...q, type, correct };
    };

    const handleSubmit = async () => {
      try {
        if (quizId && !quiz.fallback) {
          const backendAnswers = {};
          Object.entries(answers).forEach(([idx, answer]) => {
            const q = questions[idx];
            if (q && (q.type === 'multiple_choice' || q.type === 'multiple')) {
              const indexToLetter = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' };
              backendAnswers[idx] = indexToLetter[answer] || answer;
            } else if (q && (q.type === 'boolean' || q.type === 'true_false')) {
              backendAnswers[idx] = answer ? 'True' : 'False';
            } else {
              backendAnswers[idx] = answer;
            }
          });

          const response = await api.submitQuiz(quizId, backendAnswers);
          setScore(Math.round(response.score / 100 * questions.length));
          setSubmitted(true);
          console.log('✅ Quiz submitted to Django:', response);
          return;
        }
      } catch (err) {
        console.error('❌ Quiz submission failed, calculating locally:', err);
      }

      let correct = 0;
      questions.forEach((q, i) => {
        const normalized = normalizeQuestion(q);
        if ((normalized.type === 'multiple' || normalized.type === 'multiple_choice') && answers[i] === normalized.correct) correct++;
        if ((normalized.type === 'boolean' || normalized.type === 'true_false') && answers[i] === normalized.correct) correct++;
      });
      setScore(correct);
      setSubmitted(true);
    };

    return (
      <div>
        {quiz.fallback && (
          <div style={{
            padding: '12px',
            background: colors.warning + '15',
            border: `1px solid ${colors.warning}`,
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '12px',
            color: colors.warning,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            Demo quiz • Connect Django for dynamic generation
          </div>
        )}

        {questions.map((rawQ, index) => {
          const q = normalizeQuestion(rawQ);
          return (
          <div key={q.id || index} style={{
            marginBottom: '24px',
            padding: '20px',
            background: colors.bg,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: colors.text,
              marginBottom: '12px'
            }}>
              Question {index + 1}: {q.question}
            </div>

            {q.type === 'multiple' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {q.options.map((option, i) => (
                  <label key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    background: colors.surface,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: `1px solid ${answers[index] === i ? colors.primary : colors.border}`,
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="radio"
                      name={`q${index}`}
                      checked={answers[index] === i}
                      onChange={() => setAnswers({...answers, [index]: i})}
                      disabled={submitted}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', color: colors.text }}>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'boolean' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                {[true, false].map((value) => (
                  <button
                    key={value.toString()}
                    onClick={() => setAnswers({...answers, [index]: value})}
                    disabled={submitted}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: answers[index] === value ? colors.primary : colors.surface,
                      color: answers[index] === value ? 'white' : colors.text,
                      border: `1px solid ${answers[index] === value ? colors.primary : colors.border}`,
                      borderRadius: '8px',
                      cursor: submitted ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    {value ? 'True' : 'False'}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'short' && (
              <textarea
                value={answers[index] || ''}
                onChange={(e) => setAnswers({...answers, [index]: e.target.value})}
                disabled={submitted}
                placeholder="Type your answer..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: colors.text,
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            )}

            {submitted && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: (q.type === 'multiple' && answers[index] === q.correct) || 
                           (q.type === 'boolean' && answers[index] === q.correct)
                  ? `${colors.success}15`
                  : `${colors.error}15`,
                borderRadius: '8px',
                border: `1px solid ${(q.type === 'multiple' && answers[index] === q.correct) || 
                                    (q.type === 'boolean' && answers[index] === q.correct)
                  ? colors.success
                  : colors.error}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: (q.type === 'multiple' && answers[index] === q.correct) || 
                         (q.type === 'boolean' && answers[index] === q.correct)
                    ? colors.success
                    : colors.error,
                  marginBottom: '8px'
                }}>
                  {(q.type === 'multiple' && answers[index] === q.correct) || 
                   (q.type === 'boolean' && answers[index] === q.correct) ? (
                    <Check size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  {(q.type === 'multiple' && answers[index] === q.correct) || 
                   (q.type === 'boolean' && answers[index] === q.correct)
                    ? 'Correct!'
                    : 'Incorrect'}
                </div>
                <div style={{ fontSize: '12px', color: colors.text, lineHeight: 1.5 }}>
                  {q.explanation}
                </div>
              </div>
            )}
          </div>
        );
        })}

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? t.loading : t.submit}
          </button>
        ) : (
          <div style={{
            padding: '20px',
            background: `${colors.primary}10`,
            borderRadius: '12px',
            border: `1px solid ${colors.primary}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: colors.primary, marginBottom: '8px' }}>
              {score}/{questions.length}
            </div>
            <div style={{ fontSize: '14px', color: colors.text, marginBottom: '16px' }}>
              You got {Math.round((score / questions.length) * 100)}% correct
            </div>
            <div style={{
              fontSize: '13px',
              color: colors.textSecondary,
              padding: '12px',
              background: colors.surface,
              borderRadius: '8px'
            }}>
              <strong>{t.nextTopic}:</strong> Polymorphism in depth
            </div>
          </div>
        )}
      </div>
    );
  };

  const ExampleDisplay = () => (
    <div style={{
      padding: '20px',
      background: colors.codeBlock,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      fontFamily: 'monospace',
      fontSize: '13px',
      lineHeight: 1.6,
      color: colors.text,
      overflowX: 'auto'
    }}>
      <pre style={{ margin: 0 }}>{`class Vehicle:
    def __init__(self, brand, model):
        self.brand = brand
        self.model = model
        
    def display_info(self):
        print(f"{self.brand} {self.model}")

class Car(Vehicle):
    def __init__(self, brand, model, doors):
        super().__init__(brand, model)
        self.doors = doors
        
    def display_info(self):
        super().display_info()
        print(f"Doors: {self.doors}")

# Creating instances
my_car = Car("Toyota", "Camry", 4)
my_car.display_info()

# Output:
# Toyota Camry
# Doors: 4`}</pre>
    </div>
  );

  // Upload & Explain Page
  const UploadPage = () => {
    const [uploadMode, setUploadMode] = useState('file');
    const [pastedContent, setPastedContent] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFileUpload(file);
      }
    };

    const handlePasteSubmit = async () => {
      if (!pastedContent.trim()) return;
      
      try {
        setLoading(true);
        const response = await api.explainContent(pastedContent, {
          subject: currentSubject,
          topic: 'Pasted Content'
        });

        setCurrentPage('chat');
        const message = {
          role: 'assistant',
          content: response.explanation || response.message,
          timestamp: new Date().toISOString(),
          references: response.references
        };
        setMessages(prev => [...prev, message]);
        
        console.log('✅ Content explained:', response);
      } catch (err) {
        console.error('❌ Explanation failed:', err);
        // Fallback
        setCurrentPage('chat');
        handleSendMessage(pastedContent, 'explain');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        background: colors.bg
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          background: colors.surface,
          borderRadius: '16px',
          padding: '40px',
          border: `1px solid ${colors.border}`
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: colors.primaryLight,
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <Upload size={32} color={colors.primary} />
          </div>

          <h2 style={{
            fontSize: '28px',
            fontWeight: 800,
            color: colors.text,
            textAlign: 'center',
            marginBottom: '12px'
          }}>
            {t.uploadExplain}
          </h2>

          <p style={{
            fontSize: '15px',
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            Upload lecture slides or paste content to get AI-powered explanations
          </p>

          {/* Mode Toggle */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            background: colors.bg,
            padding: '4px',
            borderRadius: '10px'
          }}>
            <button
              onClick={() => setUploadMode('file')}
              style={{
                flex: 1,
                padding: '12px',
                background: uploadMode === 'file' ? colors.surface : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: uploadMode === 'file' ? colors.primary : colors.textSecondary,
                transition: 'all 0.2s'
              }}
            >
              {t.uploadFile}
            </button>
            <button
              onClick={() => setUploadMode('paste')}
              style={{
                flex: 1,
                padding: '12px',
                background: uploadMode === 'paste' ? colors.surface : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: uploadMode === 'paste' ? colors.primary : colors.textSecondary,
                transition: 'all 0.2s'
              }}
            >
              {t.pasteContent}
            </button>
          </div>

          {uploadMode === 'file' ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${colors.border}`,
                  borderRadius: '12px',
                  padding: '60px 40px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.background = colors.primaryLight;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <FileText size={48} color={colors.textTertiary} style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>
                  {loading ? 'Uploading...' : 'Drop files here or click to browse'}
                </div>
                <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                  PDF, PPT, DOCX (Max 10MB)
                </div>
              </div>
            </>
          ) : (
            <>
              <textarea
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder="Paste lecture content, topic name, or questions here..."
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '16px',
                  background: colors.bg,
                  border: `2px solid ${colors.border}`,
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: colors.text,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: 1.6
                }}
              />
              <button
                onClick={handlePasteSubmit}
                disabled={!pastedContent.trim() || loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: pastedContent.trim() && !loading ? colors.primary : colors.surfaceHover,
                  color: pastedContent.trim() && !loading ? 'white' : colors.textTertiary,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: pastedContent.trim() && !loading ? 'pointer' : 'not-allowed',
                  marginTop: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? <Loader size={18} className="spinner" /> : <Sparkles size={18} />}
                {loading ? t.loading : 'Explain with AI'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Quiz Generator Page
  const QuizGeneratorPage = () => {
    const [quizConfig, setQuizConfig] = useState({
      subject: 'oop',
      topic: '',
      numQuestions: 5,
      difficulty: 'medium',
      types: {
        multiple: true,
        boolean: true,
        short: true
      }
    });

    const handleGenerateQuiz = () => {
      const selectedTypes = Object.keys(quizConfig.types).filter(key => quizConfig.types[key]);
      generateQuiz({
        ...quizConfig,
        types: selectedTypes
      });
    };

    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px',
        background: colors.bg
      }}>
        <div style={{
          maxWidth: '800px',
          width: '100%'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: colors.accent + '20',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <FileQuestion size={32} color={colors.accent} />
            </div>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 800,
              color: colors.text,
              marginBottom: '12px'
            }}>
              {t.quizGenerator}
            </h2>
            <p style={{
              fontSize: '16px',
              color: colors.textSecondary
            }}>
              Generate custom quizzes on any topic
            </p>
          </div>

          {/* Quiz Configuration */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '32px',
            border: `1px solid ${colors.border}`,
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: colors.text,
              marginBottom: '20px'
            }}>
              Configure Your Quiz
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.text,
                  marginBottom: '8px'
                }}>
                  Subject
                </label>
                <select
                  value={quizConfig.subject}
                  onChange={(e) => setQuizConfig({...quizConfig, subject: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: colors.text,
                    cursor: 'pointer'
                  }}
                >
                  <option value="oop">Object-Oriented Programming</option>
                  <option value="ds">Data Structures</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.text,
                  marginBottom: '8px'
                }}>
                  Topic
                </label>
                <input
                  type="text"
                  value={quizConfig.topic}
                  onChange={(e) => setQuizConfig({...quizConfig, topic: e.target.value})}
                  placeholder="e.g., Inheritance and Polymorphism"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: colors.text
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.text,
                    marginBottom: '8px'
                  }}>
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    value={quizConfig.numQuestions}
                    onChange={(e) => setQuizConfig({...quizConfig, numQuestions: parseInt(e.target.value)})}
                    min="3"
                    max="20"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.text,
                    marginBottom: '8px'
                  }}>
                    Difficulty
                  </label>
                  <select
                    value={quizConfig.difficulty}
                    onChange={(e) => setQuizConfig({...quizConfig, difficulty: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: colors.text,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.text,
                  marginBottom: '12px'
                }}>
                  Question Types
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { key: 'multiple', label: 'Multiple Choice' },
                    { key: 'boolean', label: 'True/False' },
                    { key: 'short', label: 'Short Answer' }
                  ].map(({ key, label }) => (
                    <label key={key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={quizConfig.types[key]}
                        onChange={(e) => setQuizConfig({
                          ...quizConfig,
                          types: {...quizConfig.types, [key]: e.target.checked}
                        })}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: colors.text }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? colors.surfaceHover : colors.accent,
                color: loading ? colors.textTertiary : 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? <Loader size={18} className="spinner" /> : <Sparkles size={18} />}
              {loading ? t.loading : 'Generate Quiz'}
            </button>
          </div>

          {/* Recent Quizzes */}
          {isAuthenticated && (
            <div style={{
              background: colors.surface,
              borderRadius: '16px',
              padding: '32px',
              border: `1px solid ${colors.border}`
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: colors.text,
                marginBottom: '16px'
              }}>
                Recent Quizzes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { topic: 'Inheritance Basics', score: '4/5', date: '2 days ago' },
                  { topic: 'Binary Trees', score: '7/10', date: '1 week ago' },
                ].map((quiz, i) => (
                  <div key={i} style={{
                    padding: '16px',
                    background: colors.bg,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = colors.bg}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>
                        {quiz.topic}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                        {quiz.date}
                      </div>
                    </div>
                    <div style={{
                      padding: '6px 12px',
                      background: colors.success + '20',
                      color: colors.success,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}>
                      {quiz.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Show login page if not authenticated and user clicked login
  if (showLoginPage && !isAuthenticated) {
    return <LoginPage colors={colors} t={t} onSuccess={() => setShowLoginPage(false)} />;
  }

  // Main Layout
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      direction: isRTL ? 'rtl' : 'ltr',
      minHeight: '100vh',
      background: colors.bg,
      color: colors.text
    }}>
      <style>{`
        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; transform: scale(1); }
          30% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        input::placeholder, textarea::placeholder {
          color: ${colors.textTertiary};
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${colors.bg};
        }
        ::-webkit-scrollbar-thumb {
          background: ${colors.border};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${colors.textTertiary};
        }
      `}</style>

      <Sidebar />
      <div style={{
        marginLeft: isRTL ? 0 : (sidebarOpen ? '260px' : 0),
        marginRight: isRTL ? (sidebarOpen ? '260px' : 0) : 0,
        transition: 'margin 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <TopBar />
        <div style={{
          marginTop: '64px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {currentPage === 'home' && <HomePage />}
          {currentPage === 'chat' && <ChatPage />}
          {currentPage === 'upload' && <UploadPage />}
          {currentPage === 'quiz' && <QuizGeneratorPage />}
        </div>
      </div>
    </div>
  );
}
