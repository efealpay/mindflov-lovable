// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { quadtree } from 'd3-quadtree';
import ReactMarkdown from 'react-markdown';
import { 
  Plus, Zap, Loader2, ChevronRight, Layers, ZoomIn, ZoomOut, Maximize, Save, Combine, 
  FileText, Palette, Briefcase, Rocket, Globe, FolderOpen, Sliders, RotateCcw, Copy,
  AlertCircle, BookOpen, ListTodo, X, Undo, Redo, Image as ImageIcon, Download, FilePlus, Settings, Home, Trash2, Edit2, Check, HelpCircle, Type as TypeIcon, Compass, Star,
  Film, Music, Building, Map as MapIcon, Megaphone, Share2, Coffee, Gift, Heart, Scissors, Shirt, Gamepad2, Layout, Calendar, Users, Utensils, GraduationCap, Edit3, PenTool, Box, Package, MessageSquare, Monitor, NotebookPen
} from 'lucide-react';
import { auth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from '@/lib/cloud/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, updateDoc, onSnapshot } from '@/lib/cloud/db';
import { Type, generateWithAi as callAiEndpoint } from './lib/genai';
import UpgradeModal from './components/UpgradeModal';
import ExportModal from './components/ExportModal';
import MapModal from './components/MapModal';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import HomeScreen from './components/HomeScreen';
import CheatSheetModal from './components/CheatSheetModal';
import TutorialModal from './components/TutorialModal';
import OnboardingTour from './components/OnboardingTour';
import AdminDashboard from './components/AdminDashboard';
import { useSubscription } from '@/hooks/useSubscription';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';

// --- Configuration ---
const MODEL_NAME = "gemini-3-flash-preview";
const DEFAULT_WEEKLY_LIMIT = 10;
const DEFAULT_PLUS_LIMIT = 100000;
const DEFAULT_PRO_LIMIT = 250000;
const PAYMENT_URL = "https://aikreativ.gumroad.com/l/mindflov";

const db = getFirestore();

const appId = 'mindflow-app-v4';


enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const markdownComponents = {
  h1: ({node, ...props}: any) => <h1 className="text-sm font-bold text-white mb-2 font-sans" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-sm font-bold text-white mb-2 mt-3 font-sans" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-xs font-bold text-white mb-1 mt-2 font-sans" {...props} />,
  p: ({node, ...props}: any) => <p className="mb-2 last:mb-0" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc pl-4 mb-2 space-y-0.5" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal pl-4 mb-2 space-y-0.5" {...props} />,
  li: ({node, ...props}: any) => <li className="" {...props} />,
  strong: ({node, ...props}: any) => <strong className="font-bold text-white" {...props} />,
  em: ({node, ...props}: any) => <em className="italic text-white/90" {...props} />,
  a: ({node, ...props}: any) => <a className="text-indigo-400 underline hover:text-indigo-300" {...props} />,
};

const pdfMarkdownComponents = {
  h1: ({node, ...props}: any) => <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#000', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', pageBreakAfter: 'avoid' }} {...props} />,
  h2: ({node, ...props}: any) => <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#000', marginBottom: '12px', marginTop: '24px', pageBreakAfter: 'avoid' }} {...props} />,
  h3: ({node, ...props}: any) => <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#000', marginBottom: '8px', marginTop: '16px', pageBreakAfter: 'avoid' }} {...props} />,
  p: ({node, ...props}: any) => <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#111', marginBottom: '16px' }} {...props} />,
  ul: ({node, ...props}: any) => <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginBottom: '16px', color: '#111' }} {...props} />,
  ol: ({node, ...props}: any) => <ol style={{ listStyleType: 'decimal', paddingLeft: '24px', marginBottom: '16px', color: '#111' }} {...props} />,
  li: ({node, ...props}: any) => <li style={{ fontSize: '14px', lineHeight: '1.6', color: '#111', marginBottom: '4px' }} {...props} />,
  strong: ({node, ...props}: any) => <strong style={{ fontWeight: 700, color: '#000' }} {...props} />,
  em: ({node, ...props}: any) => <em style={{ fontStyle: 'italic', color: '#000' }} {...props} />,
  a: ({node, ...props}: any) => <a style={{ color: '#4f46e5', textDecoration: 'underline' }} {...props} />,
};


const ROLE_CATEGORIES = [
  {
    category: 'Core',
    roles: ['default', 'custom']
  },
  {
    category: 'Creative Industries',
    roles: ['storyteller', 'brand', 'music']
  },
  {
    category: 'Architecture & Spaces',
    roles: ['architect', 'urbanist', 'interior_res', 'interior_com']
  },
  {
    category: 'Marketing & Content',
    roles: ['campaign', 'content', 'social', 'communication']
  },
  {
    category: 'Product & Design',
    roles: ['product', 'graphic', 'industrial', 'fashion', 'game']
  },
  {
    category: 'Experiences & Events',
    roles: ['event', 'culinary', 'gift', 'curriculum', 'author']
  }
];

const PREDEFINED_ROLES = [
  { id: 'default', label: 'General Framework', icon: <Layers className="w-4 h-4" />, prompt: '' },
  { id: 'founder', label: 'Startup Founder', icon: <Briefcase className="w-4 h-4" />, prompt: 'This context is for startup founders and entrepreneurs building a new product or business. Focus on market viability, monetization, metrics, and growth.' },
  { id: 'storyteller', label: 'Storyteller', icon: <Film className="w-4 h-4" />, prompt: 'This context is for projects that develop narrative works. Focus on character, conflict, theme, world, and emotional arc. Every idea should deepen the story or reveal a new dramatic possibility.' },
  { id: 'brand', label: 'Brand Architect', icon: <Globe className="w-4 h-4" />, prompt: 'This context is for projects that build brand identities. Focus on positioning, personality, visual language, and voice. Ideas must cohere into a distinct, ownable identity.' },
  { id: 'music', label: 'Music Conceptor', icon: <Music className="w-4 h-4" />, prompt: 'This context is for projects that shape musical works. Focus on mood, sonic texture, narrative arc across tracks, and the world the sound evokes.' },
  { id: 'architect', label: 'Architect', icon: <Building className="w-4 h-4" />, prompt: 'This context is for projects that design building concepts. Focus on program, site and context, material and form, human experience, and the constraints that shape the design.' },
  { id: 'urbanist', label: 'Urbanist', icon: <MapIcon className="w-4 h-4" />, prompt: 'This context is for projects that plan at the urban scale. Focus on systems — mobility, density, ecology, economy, and community — and how interventions phase over time.' },
  { id: 'campaign', label: 'Campaign Strategist', icon: <Megaphone className="w-4 h-4" />, prompt: 'This context is for projects that develop marketing campaigns. Focus on audience, message, channel, and the creative idea that ties them together.' },
  { id: 'content', label: 'Content Strategist', icon: <FileText className="w-4 h-4" />, prompt: 'This context is for projects that build sustainable content strategies. Focus on topic territories, formats, audience value, and repeatable series.' },
  { id: 'social', label: 'Social Creator', icon: <Share2 className="w-4 h-4" />, prompt: 'This context is for projects that create social content built to spread. Focus on hooks, trends, emotion, and immediate shareability.' },
  { id: 'interior_res', label: 'Interior (Res)', icon: <Home className="w-4 h-4" />, prompt: 'This context is for projects that design residential interiors. Focus on mood, materials and palette, spatial function, and the way the space serves daily life — within real constraints of light, size, and budget.' },
  { id: 'interior_com', label: 'Hospitality Design', icon: <Coffee className="w-4 h-4" />, prompt: 'This context is for projects that design hospitality spaces. Focus on concept, guest experience, spatial storytelling, and the memorable moment guests will talk about.' },
  { id: 'gift', label: 'Gift Curator', icon: <Gift className="w-4 h-4" />, prompt: 'This context is for projects that find the right gift. Focus on the recipient\'s interests and personality, the occasion, budget, and the element of surprise — aim for gifts that feel personal, not generic.' },
  { id: 'fashion', label: 'Fashion Designer', icon: <Shirt className="w-4 h-4" />, prompt: 'This context is for projects that develop fashion collections. Focus on inspiration, silhouette and material, cohesion across pieces, and the story the collection tells.' },
  { id: 'game', label: 'Game Designer', icon: <Gamepad2 className="w-4 h-4" />, prompt: 'This context is for projects that design games. Focus on core mechanics, player experience, narrative and world, and the loop that keeps players engaged.' },
  { id: 'product', label: 'Product (UX)', icon: <Layout className="w-4 h-4" />, prompt: 'This context is for projects that design product experiences. Focus on user goals, friction points, feature possibilities, and usability — solve real problems, not add features.' },
  { id: 'event', label: 'Event Designer', icon: <Calendar className="w-4 h-4" />, prompt: 'This context is for projects that plan events. Focus on theme, guest experience, logistics, and the moments that make it memorable — tailored to the people attending.' },
  { id: 'culinary', label: 'Culinary Creator', icon: <Utensils className="w-4 h-4" />, prompt: 'This context is for projects that develop menus or dishes. Focus on flavor, technique, ingredient story, and the progression of an eating experience.' },
  { id: 'curriculum', label: 'Curriculum Design', icon: <GraduationCap className="w-4 h-4" />, prompt: 'This context is for projects that design learning. Focus on concepts to teach, real-world relevance, activities, and how understanding is built and assessed.' },
  { id: 'author', label: 'Author', icon: <NotebookPen className="w-4 h-4" />, prompt: 'This context is for projects that develop written works — books, essays, or articles. Focus on ideas, argument or narrative structure, voice, and what the reader takes away.' },
  { id: 'graphic', label: 'Graphic Design', icon: <Palette className="w-4 h-4" />, prompt: 'This context is for projects that develop graphic design concepts. Focus on typography, layout, visual hierarchy, and the overarching aesthetic narrative.' },
  { id: 'industrial', label: 'Industrial Design', icon: <Package className="w-4 h-4" />, prompt: 'This context is for projects that design physical industrial products. Focus on form, materials, ergonomics, manufacturing constraints, and the user\'s tactile experience.' },
  { id: 'communication', label: 'Comm. Design', icon: <MessageSquare className="w-4 h-4" />, prompt: 'This context is for projects that design communication strategies. Focus on message clarity, medium, audience perception, and the narrative flow of information.' },
  { id: 'custom', label: 'Custom Context', icon: <Settings className="w-4 h-4" />, prompt: '' }
];

const MODES_MAP: Record<string, any> = {
    founder: {
      general: { label: "Neural Bridge", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Expand on the concept with varied, highly relevant keywords." },
      devil: { label: "Devil's Advocate", color: "#ef4444", icon: <AlertCircle className="w-4 h-4" />, prompt: "Actively critique the idea, identify potential points of failure, market risks, or logical gaps, and suggest mitigations." },
      monetize: { label: "Monetization", color: "#10b981", icon: <Briefcase className="w-4 h-4" />, prompt: "Convert the concept into specific pricing strategies, revenue models, or upsell paths." },
      growth: { label: "Growth Hack", color: "#f97316", icon: <Rocket className="w-4 h-4" />, prompt: "Generate unconventional, low-cost marketing or distribution tactics specific to the idea to get eyes on it." },
      kpi: { label: "Success Metrics", color: "#06b6d4", icon: <Box className="w-4 h-4" />, prompt: "Define exactly how to measure the success of the idea, specifying metrics to track and qualitative signals to look for." }
    },
    storyteller: {
      general: { label: "Story Threads", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch the premise into plot possibilities, character motives, conflicts, and 'what if' turns. Surface unexpected directions the story could take." },
      design: { label: "Tone & Image", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the concept into mood, imagery, symbol, and metaphor. Express 'this story feels like ___' to unlock its emotional core." },
      business: { label: "Story Engine", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Expose the mechanics — stakes, cause-and-effect, act structure, the conflict actually driving the story. Identify what's propelling or blocking it." },
      marketing: { label: "Audience Pull", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on what grips a viewer — the dramatic question, the promise, the emotional payoff that keeps them watching." }
    },
    brand: {
      general: { label: "Territory Map", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch into positioning territories, values, and associations the brand could own. Surface angles left open by competitors." },
      design: { label: "Brand Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the brand into archetype, metaphor, texture, and visual symbol. 'The brand is like ___.'" },
      persona: { label: "Persona Mapping", color: "#3b82f6", icon: <Users className="w-4 h-4" />, prompt: "Generate a highly specific target demographic, detailing their pain points, psychological triggers, and where they hang out online." },
      business: { label: "Positioning Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on differentiation, target, price posture, and the reason to believe. Locate the real point of leverage or the gap causing confusion." },
      marketing: { label: "Voice & Hook", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on tagline territory, tone of voice, and the message that makes the audience feel something and remember." }
    },
    music: {
      general: { label: "Track Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch into track themes, motifs, and lyrical territories. Surface variations and contrasts that extend the body of work." },
      design: { label: "Sound Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the concept into sonic textures, visual imagery, and metaphor. 'This section sounds like ___.'" },
      business: { label: "Album Arc", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on sequencing, dynamics, and the emotional arc from first to last track. Identify where energy rises, drops, or stalls." },
      marketing: { label: "Listener Hook", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on the hook, the shareable moment, and how a first-time listener enters the world." }
    },
    architect: {
      general: { label: "Program Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch into spatial programs, circulation ideas, and site responses. Surface unexpected ways to organize the brief." },
      design: { label: "Form Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate site constraints and program into formal and material metaphors. 'The building behaves like ___.'" },
      business: { label: "Constraint Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on structure, environment, budget, and code as design drivers. Identify the constraint that could generate the concept rather than limit it." },
      marketing: { label: "Experience", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on how a person moves through, feels, and remembers the space — the experiential sequence." }
    },
    urbanist: {
      general: { label: "Systems Map", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch into the urban systems at play — mobility, density, services, ecology, economy — and their interactions." },
      design: { label: "Place Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the area into a metaphor of character and identity. 'This district should feel like ___.'" },
      business: { label: "Intervention Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on phasing, leverage points, and second-order effects. Identify the single intervention that unlocks the most value." },
      marketing: { label: "Community Pull", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on stakeholders, lived experience, and the story that gets a community to support the plan." }
    },
    campaign: {
      general: { label: "Angle Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch into campaign angles, audience segments, and channels. Surface non-obvious combinations." },
      design: { label: "Creative Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the offer into a creative metaphor or campaign world. 'The campaign is like ___.'" },
      growth: { label: "Growth Hack", color: "#f97316", icon: <Rocket className="w-4 h-4" />, prompt: "Generate unconventional, low-cost marketing or distribution tactics specific to the idea to get eyes on it." },
      business: { label: "Segment Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on which segment, message, and channel actually fit together, and where the funnel is leaking." },
      marketing: { label: "Hook & Trigger", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on attention-grabbing hooks, emotional triggers, and shareable moments." },
      titles: { label: "Title Generator", color: "#10b981", icon: <TypeIcon className="w-4 h-4" />, prompt: "Convert this idea into a variety of high-performing, clickable video or content titles to provide tangible execution direction." }
    },
    content: {
      general: { label: "Topic Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch into topic territories, sub-themes, and content angles that map to audience interests." },
      design: { label: "Format Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate topics into formats and framings that make them vivid and watchable." },
      business: { label: "Series Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on which topic-format pairs form a repeatable series you can actually sustain. Identify what's draining output." },
      marketing: { label: "Audience Value", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on the value each piece delivers and the reason the audience returns." },
      titles: { label: "Title Generator", color: "#10b981", icon: <TypeIcon className="w-4 h-4" />, prompt: "Convert this topic into a variety of compelling, curiosity-driven video or article titles for tangible execution." }
    },
    social: {
      general: { label: "Angle Storm", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Rapidly branch one idea into many distinct angles, hooks, and framings. Prioritize quantity and variety." },
      design: { label: "Visual Hook", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the idea into a visual or opening moment that stops the scroll in the first second." },
      visual: { label: "Visual Prompts", color: "#a855f7", icon: <ImageIcon className="w-4 h-4" />, prompt: "Translate the abstract idea into a highly detailed, comma-separated prompt ready to be pasted into AI image generators like Midjourney or DALL-E." },
      persona: { label: "Persona Mapping", color: "#3b82f6", icon: <Users className="w-4 h-4" />, prompt: "Generate a highly specific target demographic, detailing their pain points, psychological triggers, and where they hang out online." },
      business: { label: "Format Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on format, length, and platform fit. Identify why an angle isn't landing and what to change." },
      marketing: { label: "Trend & Trigger", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on current trends, emotional triggers, and the moment that makes people share." },
      titles: { label: "Title Generator", color: "#10b981", icon: <TypeIcon className="w-4 h-4" />, prompt: "Convert this hook into a variety of scroll-stopping video or post titles to provide a clear, actionable direction." }
    },
    interior_res: {
      general: { label: "Scheme Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch into palette, material, and layout directions that fit the brief." },
      design: { label: "Mood Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the desired feeling into materials, colors, and imagery. 'This room should feel like ___.'" },
      business: { label: "Constraint Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on light, dimensions, flow, and budget as design drivers. Turn the tightest constraint into the design's organizing idea." },
      marketing: { label: "Living Fit", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on how people live in the space day-to-day and what makes it genuinely comfortable." }
    },
    interior_com: {
      general: { label: "Concept Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch into concepts, themes, and spatial ideas that give the venue a distinct identity." },
      design: { label: "Space Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the concept into spatial metaphor, materials, and atmosphere. 'Entering feels like ___.'" },
      business: { label: "Experience Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on the guest journey, service flow, and operational reality. Identify friction in how people move and are served." },
      marketing: { label: "Guest Story", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on the memorable, photographable moment guests describe to others." }
    },
    gift: {
      general: { label: "Interest Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch each of the recipient's interests into specific gift territories and directions." },
      design: { label: "Surprise Bridge", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Combine two of the recipient's interests into an unexpected gift idea. 'What sits between X and Y?'" },
      business: { label: "Budget Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on organizing ideas by budget tier and practicality, from small gestures to statement gifts." },
      marketing: { label: "Meaning Fit", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on what makes a gift feel thoughtful and personal to this specific person and occasion." }
    },
    fashion: {
      general: { label: "Piece Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch the inspiration into silhouettes, pieces, and material directions." },
      design: { label: "Theme Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the inspiration into mood, texture, and visual metaphor. 'This collection is ___.'" },
      business: { label: "Cohesion Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on what ties pieces into a cohesive collection — palette, motif, proportion — and where cohesion breaks." },
      marketing: { label: "Statement Hook", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on the standout look and the story that makes the collection resonate." }
    },
    game: {
      general: { label: "Mechanic Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch into mechanics, systems, and player actions the concept could support." },
      design: { label: "World Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the concept into world, tone, and thematic metaphor that gives mechanics emotional weight." },
      business: { label: "Loop Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on the core gameplay loop, progression, and tension. Identify where engagement breaks down." },
      marketing: { label: "Player Hook", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on the first-session hook and the moment players tell friends about." }
    },
    product: {
      general: { label: "Feature Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch a user goal into feature and flow possibilities." },
      design: { label: "UX Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the interaction into a familiar metaphor. 'Using this should feel like ___.'" },
      devil: { label: "Devil's Advocate", color: "#ef4444", icon: <AlertCircle className="w-4 h-4" />, prompt: "Actively critique the idea, identify potential points of failure, market risks, or logical gaps, and suggest mitigations." },
      business: { label: "Friction Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on the user's actual goal versus the friction blocking it. Locate the highest-impact point to fix." },
      kpi: { label: "Success Metrics", color: "#06b6d4", icon: <Box className="w-4 h-4" />, prompt: "Define exactly how to measure the success of the idea, specifying metrics to track and qualitative signals to look for." },
      marketing: { label: "Adoption Hook", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on the moment a user first feels the product's value and how to reach it faster." }
    },
    event: {
      general: { label: "Theme Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch the occasion and guests' interests into themes and activity ideas." },
      design: { label: "Experience Bridge", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Combine two interests or elements into a cohesive event concept. 'What connects X and Y?'" },
      business: { label: "Flow Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on timeline, flow, and logistics. Identify where energy dips or the schedule strains." },
      marketing: { label: "Memory Hook", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on the moment guests will remember and retell." }
    },
    culinary: {
      general: { label: "Flavor Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch an ingredient or theme into flavor pairings, techniques, and dish directions." },
      design: { label: "Dish Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate a feeling or story into a dish concept. 'This plate should express ___.'" },
      business: { label: "Menu Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on balance, progression, and pacing across the menu. Identify where it feels repetitive or unbalanced." },
      marketing: { label: "Craving Hook", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on the crave-able signature dish and how it's described to guests." }
    },
    curriculum: {
      general: { label: "Concept Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch a learning topic into sub-concepts, examples, and connections to other subjects." },
      design: { label: "Real-World Bridge", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate an abstract concept into a real-world analogy or hook students already understand." },
      business: { label: "Learning Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on the sequence that builds understanding and the point where learners typically struggle." },
      marketing: { label: "Engagement Hook", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on the activity or question that makes the topic feel relevant and worth their attention." }
    },
    author: {
      general: { label: "Idea Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch the subject into themes, angles, and questions worth exploring." },
      design: { label: "Frame Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the subject into a metaphor or frame that reorganizes how it's understood." },
      business: { label: "Structure Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on the structure that carries the argument or narrative. Identify where logic or momentum breaks." },
      marketing: { label: "Reader Takeaway", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on what the reader should feel or understand by the end, and the hook that earns their attention." }
    },
    graphic: {
      general: { label: "Topic Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch into visual themes, layout concepts, and typographic directions." },
      design: { label: "Visual Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the core message into a visual metaphor, color palette, and textural style. 'The design feels like ___.'" },
      visual: { label: "Visual Prompts", color: "#a855f7", icon: <ImageIcon className="w-4 h-4" />, prompt: "Translate the abstract idea into a highly detailed, comma-separated prompt ready to be pasted into AI image generators like Midjourney or DALL-E." },
      business: { label: "Layout Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on grid structure, visual hierarchy, and how the eye moves across the canvas." },
      marketing: { label: "Audience Hook", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on visual impact, readability, and the emotional impression it leaves on the viewer." }
    },
    industrial: {
      general: { label: "Form Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch into physical forms, ergonomic shapes, and material combinations." },
      design: { label: "Form Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the product's function into a physical metaphor. 'Holding this feels like ___.'" },
      business: { label: "Assembly Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on manufacturing logic, part reduction, materials, and how it is physically assembled." },
      marketing: { label: "Interaction Hook", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on the first tactile touchpoint, the 'wow' feature, and the emotional connection during use." }
    },
    communication: {
      general: { label: "Message Branching", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Branch into core messages, tones of voice, and storytelling angles." },
      design: { label: "Tone Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Translate the message into an emotional tone or character. 'The voice sounds like ___.'" },
      business: { label: "Narrative Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on information architecture, pacing, and how the narrative logically builds." },
      marketing: { label: "Resonance Hook", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on the call-to-action, the takeaway, and what compels the audience to respond." }
    },
    default: {
      general: { label: "Neural Bridge", color: "#818cf8", icon: <Zap className="w-4 h-4" />, prompt: "Expand on the concept with varied, highly relevant keywords." },
      design: { label: "Visual Metaphor", color: "#f472b6", icon: <Palette className="w-4 h-4" />, prompt: "Focus strictly on analogies, visual symbols, metaphors, textures, and aesthetic descriptors. Think in terms of 'The [Concept] is like a [Analogy]'." },
      business: { label: "Strategic Logic", color: "#fbbf24", icon: <Briefcase className="w-4 h-4" />, prompt: "Focus on market opportunities, revenue models, scalability, and strategic applications." },
      marketing: { label: "Viral Hook", color: "#22d3ee", icon: <Rocket className="w-4 h-4" />, prompt: "Focus on attention-grabbing hooks, campaign themes, and emotional triggers for consumers." }
    }
};

const ALL_MODES = Object.values(MODES_MAP).reduce((acc, modes) => ({ ...acc, ...modes }), {});

const getModesForRole = (roleId: string) => {
  return MODES_MAP[roleId] || MODES_MAP['default'];
};



const NodeComponent = React.memo(({
  node,
  isSelected,
  isRelated,
  r,
  color,
  isNew,
  depth,
  isGenerating,
  zoom,
  editingNodeId,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onDoubleClick,
  onTextDoubleClick,
  setNodeRef
}: any) => {
  return (
    <g 
      ref={setNodeRef}
      transform={`translate(${node.x},${node.y})`} 
      className="group cursor-pointer" 
      onContextMenu={(e) => onContextMenu(e, node.id)}
      onMouseEnter={() => onMouseEnter(node.id)} 
      onMouseLeave={onMouseLeave} 
      onMouseDown={(e) => onMouseDown(e, node.id)} 
      onMouseUp={(e) => onMouseUp(e, node.id)}
      onDoubleClick={(e) => onDoubleClick(e, node.id)} 
      style={{ opacity: isRelated ? 1 : 0.3, transition: 'opacity 0.4s' }}
    >
      {isNew && <circle r={r + 15} className="fill-indigo-500/5 stroke-indigo-500/20 animate-pulse" />}
      
      {isGenerating && (
        <>
          <circle r={r + 10} className="fill-none stroke-white stroke-[3] animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-60" />
          <circle r={r + 20} className="fill-none stroke-white/50 stroke-[2] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
        </>
      )}
      
      {(() => {
        const commonProps = {
            fill: "#020617",
            stroke: isSelected ? '#fff' : color,
            strokeWidth: isRelated ? 2 : 1.5,
            className: `transition-all duration-300 ${depth === 0 ? 'animate-[pulse_4s_ease-in-out_infinite]' : ''}`
        };

        if (node.isSynthesis) {
            return <rect x={-r} y={-r} width={r*2} height={r*2} transform="rotate(45)" rx="2" {...commonProps} />;
        }
        if (depth === 0) {
            const points = Array.from({length: 6}).map((_, i) => {
                const angle = (i * 60 - 30) * Math.PI / 180;
                return `${Math.cos(angle) * r},${Math.sin(angle) * r}`;
            }).join(' ');
            return <polygon points={points} {...commonProps} className={`${commonProps.className} animate-[pulse_4s_ease-in-out_infinite]`} />;
        }
        if (depth === 1) {
            return <rect x={-r} y={-r} width={r*2} height={r*2} rx="8" {...commonProps} />;
        }
        if (depth === 2) {
            const points = Array.from({length: 5}).map((_, i) => {
                const angle = (i * 72 - 18) * Math.PI / 180;
                return `${Math.cos(angle) * r},${Math.sin(angle) * r}`;
            }).join(' ');
            return <polygon points={points} {...commonProps} />;
        }
        return <circle r={r} {...commonProps} />;
      })()}
      
      <circle r={r * 0.4} fill={color} opacity="0.3" className={`pointer-events-none ${depth === 0 ? 'animate-[spin_10s_linear_infinite]' : depth === 1 ? 'animate-[spin_15s_linear_infinite]' : ''}`} />
      
      <g>
        {(() => {
          const indOuterR = Math.max(7, 8 / zoom);
          const indInnerR = Math.max(3.5, 4 / zoom);
          const indDist = r + indOuterR + 1.5;
          const strokeW = Math.max(1.5, 2 / zoom);
          return (
            <>
              {node.detail && (
                <g transform={`translate(${indDist * Math.cos(-Math.PI/3)}, ${indDist * Math.sin(-Math.PI/3)})`}>
                  <circle r={indOuterR} fill="#020617" stroke="#facc15" strokeWidth={strokeW} />
                  <circle r={indInnerR} fill="#facc15" className="animate-pulse" />
                </g>
              )}
              {node.insightData && (
                <g transform={`translate(${indDist * Math.cos(-Math.PI/6)}, ${indDist * Math.sin(-Math.PI/6)})`}>
                  <circle r={indOuterR} fill="#020617" stroke="#818cf8" strokeWidth={strokeW} />
                  <circle r={indInnerR} fill="#818cf8" className="animate-pulse" />
                </g>
              )}
              {node.planData && (
                <g transform={`translate(${indDist * Math.cos(0)}, ${indDist * Math.sin(0)})`}>
                  <circle r={indOuterR} fill="#020617" stroke="#34d399" strokeWidth={strokeW} />
                  <circle r={indInnerR} fill="#34d399" className="animate-pulse" />
                </g>
              )}
            </>
          );
        })()}
      </g>
      
      <g 
        onDoubleClick={(e) => onTextDoubleClick(e, node.id)}
        style={{ 
          pointerEvents: 'auto', 
          opacity: editingNodeId === node.id ? 0 : 1,
          cursor: 'text'
        }}
      >
        {(() => {
          const words = node.label.split(' ');
          const maxLineLength = 12;
          const lines = [];
          let currentLine = words[0] || "";
          for (let i = 1; i < words.length; i++) {
            if ((currentLine + " " + words[i]).length <= maxLineLength) {
              currentLine += " " + words[i];
            } else {
              lines.push(currentLine);
              currentLine = words[i];
            }
          }
          lines.push(currentLine);
          return (
            <>
              <text 
                 textAnchor="middle" 
                 y={r + 24} 
                 className="text-[10px] font-bold uppercase tracking-wider transition-colors" 
                 style={{ 
                   fontFamily: 'monospace', 
                   stroke: '#020617',
                  strokeWidth: '4px',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round'
                }}
              >
                {lines.map((line, i) => (
                  <tspan key={`stroke-${i}`} x={0} dy={i === 0 ? 0 : "1.2em"}>{line}</tspan>
                ))}
              </text>
              <text 
                 textAnchor="middle" 
                 y={r + 24} 
                 className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isSelected ? 'fill-white' : 'fill-white/60'}`} 
                 style={{ fontFamily: 'monospace' }}
              >
                {lines.map((line, i) => (
                  <tspan key={`fill-${i}`} x={0} dy={i === 0 ? 0 : "1.2em"}>{line}</tspan>
                ))}
              </text>
            </>
          );
        })()}
      </g>
    </g>
  );
}, (prev, next) => {
  return prev.isSelected === next.isSelected &&
         prev.isRelated === next.isRelated &&
         prev.r === next.r &&
         prev.color === next.color &&
         prev.isNew === next.isNew &&
         prev.depth === next.depth &&
         prev.isGenerating === next.isGenerating &&
         prev.zoom === next.zoom &&
         prev.editingNodeId === next.editingNodeId &&
         prev.node.id === next.node.id &&
         prev.node.label === next.node.label &&
         prev.node.detail === next.node.detail &&
         prev.node.insightData === next.node.insightData &&
         prev.node.planData === next.node.planData &&
         prev.node.x === next.node.x &&
         prev.node.y === next.node.y;
});

const LinkComponent = React.memo(({
  link,
  source,
  target,
  isSynthesis,
  isHighlighted,
  isSelected,
  setLinkRef
}: any) => {
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  let angle = Math.atan2(target.y - source.y, target.x - source.x) * (180 / Math.PI);
  if (angle > 90 || angle < -90) angle += 180;

  return (
    <g ref={setLinkRef}>
      <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={isSynthesis ? "#10b981" : "#4f46e5"} strokeWidth={isSelected ? 3 : 1.5} strokeOpacity={isHighlighted ? 0.6 : 0.2} strokeDasharray="6 3" style={{ transition: 'stroke-opacity 0.4s' }} />
      {link.label && (
        <text 
           x={midX} y={midY - 5} 
           transform={`rotate(${angle}, ${midX}, ${midY})`} 
           textAnchor="middle" 
           className={`text-[8px] font-bold uppercase tracking-widest font-mono pointer-events-none mix-blend-screen transition-opacity ${isSynthesis ? 'fill-emerald-300' : 'fill-indigo-300'}`}
           style={{ opacity: isHighlighted ? 1 : 0.1 }}
        >
          {link.label}
        </text>
      )}
    </g>
  );
}, (prev, next) => {
  return prev.isSynthesis === next.isSynthesis &&
         prev.isHighlighted === next.isHighlighted &&
         prev.isSelected === next.isSelected &&
         prev.source.id === next.source.id &&
         prev.target.id === next.target.id &&
         prev.link.label === next.link.label &&
         prev.source.x === next.source.x &&
         prev.source.y === next.source.y &&
         prev.target.x === next.target.x &&
         prev.target.y === next.target.y;
});

const App = () => {
  const [globalRole, setGlobalRole] = useState('default');
  const [tempRole, setTempRole] = useState('default');
  const MODES = useMemo(() => getModesForRole(globalRole), [globalRole]);

  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisLoadingType, setAnalysisLoadingType] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [loadLoading, setLoadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState(new Set());
  const [generatingNodeIds, setGeneratingNodeIds] = useState(new Set());
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'canvas'
  const [currentMode, setCurrentMode] = useState('general');
  const [genCount, setGenCount] = useState(6);
  const [maxWords, setMaxWords] = useState(3);
  const [user, setUser] = useState(null);
  const billing = useSubscription(user?.uid);
  const [confirmReset, setConfirmReset] = useState(false);
  const [mindmaps, setMindmaps] = useState([]);
  const [currentMindmapId, setCurrentMindmapId] = useState('current');
  const [currentMapTitle, setCurrentMapTitle] = useState('Draft Concept');
  const [globalPrimer, setGlobalPrimer] = useState('');
  const [hasShownPrimer, setHasShownPrimer] = useState(false);
  const [showPrimerModal, setShowPrimerModal] = useState(false);
  const [tempPrimer, setTempPrimer] = useState('');
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [favoriteRoles, setFavoriteRoles] = useState<string[]>(() => {
    const saved = localStorage.getItem('mindflow_favorite_roles');
    return saved ? JSON.parse(saved) : [];
  });
  const [activePrimerTab, setActivePrimerTab] = useState<'all'|'favorites'>('all');
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapModalMode, setMapModalMode] = useState('load'); // 'load' or 'save'
  const [newMapTitle, setNewMapTitle] = useState('My Mindmap');
  
  // Monetization State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCheatSheetModal, setShowCheatSheetModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [globalConfig, setGlobalConfig] = useState<{ WEEKLY_LIMIT: number; PLUS_TOKEN_LIMIT: number; PRO_TOKEN_LIMIT: number; PRO_LINK?: string; PLUS_LINK?: string }>({ WEEKLY_LIMIT: DEFAULT_WEEKLY_LIMIT, PLUS_TOKEN_LIMIT: DEFAULT_PLUS_LIMIT, PRO_TOKEN_LIMIT: DEFAULT_PRO_LIMIT });
  const [dailyUsage, setDailyUsage] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState('free'); // 'free', 'plus', 'pro'
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSynthesisModal, setShowSynthesisModal] = useState(false);
  const [synthesizedDoc, setSynthesizedDoc] = useState<string | null>(null);
  const [synthesisContext, setSynthesisContext] = useState("");
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [modelSettings, setModelSettings] = useState({
    expansion: 'gemini-3.5-flash',
    insight: 'gemini-3.5-flash',
    plan: 'gemini-3.5-flash',
    neural: 'gemini-3.5-flash'
  });
  const [includeParentContext, setIncludeParentContext] = useState(true);
  const [isDebugMode, setIsDebugMode] = useState(false);

  // New State for Analysis Features
  // Removed global analysisData since it's stored on nodes

  // Viewport State
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const zoomStateRef = useRef(zoom);
  const viewOffsetStateRef = useRef(viewOffset);
  const [repulsionStrength, setRepulsionStrength] = useState(2800);
  const repulsionStrengthRef = useRef(repulsionStrength);
  useEffect(() => { repulsionStrengthRef.current = repulsionStrength; }, [repulsionStrength]);
  
  const [isPanning, setIsPanning] = useState(false);
  
  useEffect(() => {
    const fetchConfig = async () => {
      if (!db) return;
      try {
        const configDoc = await getDoc(doc(db, 'config', 'global'));
        if (configDoc.exists()) {
          setGlobalConfig(configDoc.data() as any);
        }
      } catch (err) {
        console.error("Failed to load global config:", err);
      }
    };
    fetchConfig();
  }, []);

  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const draggedNodeIdRef = useRef(draggedNodeId);
  useEffect(() => { draggedNodeIdRef.current = draggedNodeId; }, [draggedNodeId]);
  const [linkingNodeId, setLinkingNodeId] = useState<string | null>(null);
  const linkingNodeIdRef = useRef(linkingNodeId);
  useEffect(() => { linkingNodeIdRef.current = linkingNodeId; }, [linkingNodeId]);
  const [tempLinkEnd, setTempLinkEnd] = useState<{x: number, y: number} | null>(null);
  const [selectionBox, setSelectionBox] = useState<any>(null);
  const selectionBoxRef = useRef(selectionBox);
  useEffect(() => { selectionBoxRef.current = selectionBox; }, [selectionBox]);
  const isPanningRef = useRef(isPanning);
  useEffect(() => { isPanningRef.current = isPanning; }, [isPanning]);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const startMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<any>(null);
  const abortControllerRef = useRef<any>(null);
  const physicsRef = useRef<any>(null);
  const physicsNodesRef = useRef<any[]>([]);
  const physicsLinksRef = useRef<any[]>([]);
  const nodeDOMRefs = useRef<Map<string, SVGGElement>>(new Map());
  const linkDOMRefs = useRef<Map<string, SVGGElement>>(new Map());
  const mainGroupRef = useRef<SVGGElement>(null);
  const bgGridRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<any>(null);
  const dragDeltaRef = useRef({ dx: 0, dy: 0 });

  const [rotationOffset, setRotationOffset] = useState(0);

  // --- History State ---
  const [history, setHistory] = useState<{nodes: any[], links: any[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyIndexRef = useRef(historyIndex);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);
  const historyRef = useRef(history);
  useEffect(() => { historyRef.current = history; }, [history]);
  
  // Refs for accessing latest state in callbacks/effects without triggering re-renders
  const nodesRef = useRef(nodes);
  const linksRef = useRef(links);
  
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  useEffect(() => {
    if (currentView === 'canvas' && nodes.length === 0 && !hasShownPrimer) {
      setHasShownPrimer(true);
      setTempRole(globalRole);
      setTempPrimer(globalPrimer);
      setShowPrimerModal(true);
    }
  }, [currentView, nodes.length, hasShownPrimer, globalRole, globalPrimer]);
  useEffect(() => { linksRef.current = links; }, [links]);

  useEffect(() => {
    if (currentView === 'canvas') {
      setSidebarOpen(true);
      const timer = setTimeout(() => {
        setSidebarOpen(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  useEffect(() => {
    // Keep refs in sync for the physics loop
    physicsNodesRef.current = nodes;
    physicsLinksRef.current = links;
  }, [nodes, links]);

  const pushHistory = useCallback((newNodes: any[], newLinks: any[]) => {
    const idx = historyIndexRef.current;
    let newIdx = 0;
    setHistory(prev => {
      const validSlice = (idx >= 0 && idx < prev.length) ? prev.slice(0, idx + 1) : [];
      const next = [...validSlice, { nodes: newNodes, links: newLinks }];
      if (next.length > 50) {
        next.shift();
        newIdx = 49;
      } else {
        newIdx = next.length - 1;
      }
      return next;
    });
    setHistoryIndex(newIdx);
  }, []);

  const undo = useCallback(() => {
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx > 0 && idx < hist.length) {
      const prevIndex = idx - 1;
      const state = hist[prevIndex];
      if (state && Array.isArray(state.nodes)) {
        setNodes(state.nodes);
        setLinks(state.links || []);
        setHistoryIndex(prevIndex);
      }
    }
  }, []);

  const redo = useCallback(() => {
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx >= 0 && idx < hist.length - 1) {
      const nextIndex = idx + 1;
      const state = hist[nextIndex];
      if (state && Array.isArray(state.nodes)) {
        setNodes(state.nodes);
        setLinks(state.links || []);
        setHistoryIndex(nextIndex);
      }
    }
  }, []);

  // --- Auth Initialization ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof (window as any)['__initial_auth_token'] !== 'undefined' && (window as any)['__initial_auth_token']) {
          await signInWithCustomToken(auth, (window as any)['__initial_auth_token']);
        }
      } catch (err) {
        console.error("Auth Init Error", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);

    return () => unsubscribe();
  }, []);

  // The step-by-step onboarding tour (OnboardingTour) handles first-run guidance on
  // the canvas; the tutorial reference modal stays available from the toolbar button.
  const [hasExportedOnce, setHasExportedOnce] = useState(false);
  useEffect(() => {
    if (showExportModal) setHasExportedOnce(true);
  }, [showExportModal]);


  const fetchMindmapsList = async () => {
    if (!user || !db) return;
    try {
      const q = collection(db, 'artifacts', appId, 'users', user.uid, 'mindmaps');
      const querySnapshot = await getDocs(q);
      const maps = [];
      querySnapshot.forEach((doc) => {
        maps.push({ id: doc.id, ...doc.data() });
      });
      maps.sort((a, b) => b.updatedAt - a.updatedAt);
      setMindmaps(maps);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `artifacts/${appId}/users/${user.uid}/mindmaps`);
    }
  };

  useEffect(() => { 
    if (user) {
      setCurrentView('home');
      fetchMindmapsList();
    }
  }, [user]);

  // --- Auto Save ---
  const saveToCloudRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    saveToCloudRef.current = saveToCloud;
  });

  useEffect(() => {
    if (nodes.length === 0 || !user) return;
    if (autoSaveTimeoutRef.current) return;

    // Capture the ID in closure exactly when the timeout starts
    const startingMapId = currentMindmapId;

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveTimeoutRef.current = null;
      // If we switched maps while waiting for the save tick, skip it to prevent overwriting new map with old nodes
      if (saveToCloudRef.current) {
         saveToCloudRef.current(null, false, startingMapId === 'current' ? undefined : startingMapId);
      }
    }, 2500);
  }, [nodes, links, user, currentMindmapId]);

  // --- Persistence ---
  const loadFromCloud = async (mapId = 'current') => {
    if (!user || !db) return;
    if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
    }
    setLoadLoading(true);
    setCurrentMindmapId(mapId);
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'mindmaps', mapId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNodes(data.nodes || []);
        setLinks(data.links || []);
        setGlobalRole(data.globalRole || 'default');
        setCurrentMode('general');
        setGlobalPrimer(data.globalPrimer || '');
        setHasShownPrimer(data.hasShownPrimer || false);
        setCurrentMapTitle(data.title || 'Draft Concept');
        setError(null);
        
        // Reset history on load
        setHistory([{ nodes: data.nodes || [], links: data.links || [] }]);
        setHistoryIndex(0);
        setShowMapModal(false);
        setCurrentView('canvas');
      } else if (nodes.length === 0) {
        createNewMap();
      }
    } catch (err) { 
      handleFirestoreError(err, OperationType.GET, `artifacts/${appId}/users/${user.uid}/mindmaps/${mapId}`);
      setError("Load failed.");
    } finally { setLoadLoading(false); }
  };

  const saveToCloud = async (title = null, forceNew = false, specificMapId = null) => {
    if (!user || !db) return;
    setSaveLoading(true);
    try {
      let mapId = specificMapId || currentMindmapId;
      if (forceNew || (!specificMapId && mapId === 'current')) {
        mapId = 'map-' + Date.now();
        setCurrentMindmapId(mapId);
      } else if (specificMapId) {
        setCurrentMindmapId(mapId);
      }
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'mindmaps', mapId);
      
      const docSnap = await getDoc(docRef);
      const finalTitle = title || currentMapTitle;
      
      const payload: any = { 
        nodes, 
        links, 
        globalRole,
        globalPrimer,
        hasShownPrimer,
        updatedAt: Date.now(), 
        userId: user.uid,
        title: finalTitle
      };
      
      if (!docSnap.exists()) {
        payload.createdAt = Date.now();
      } else {
        payload.createdAt = docSnap.data().createdAt || Date.now();
      }
      
      const cleanPayload = JSON.parse(JSON.stringify(payload));
      await setDoc(docRef, cleanPayload);
      setCurrentMapTitle(finalTitle);
      await fetchMindmapsList();
      if (title) {
          setShowMapModal(false);
      }
      setTimeout(() => setSaveLoading(false), 800);
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, `artifacts/${appId}/users/${user.uid}/mindmaps`);
      setError("Save failed."); 
      setSaveLoading(false); 
    }
  };

  const renameMindmap = async (mapId, newTitle) => {
    if (!user || !db) return;
    if (mapId === 'current') return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'mindmaps', mapId);
      await updateDoc(docRef, { title: newTitle, updatedAt: Date.now() });
      if (currentMindmapId === mapId) {
        setCurrentMapTitle(newTitle);
      }
      fetchMindmapsList();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `artifacts/${appId}/users/${user.uid}/mindmaps/${mapId}`);
    }
  };

  const deleteMindmap = async (mapId) => {
    if (!user || !db) return;
    if (mapId === 'current') return;
    if (!window.confirm("Are you sure you want to delete this mindmap?")) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'mindmaps', mapId);
      await deleteDoc(docRef);
      if (currentMindmapId === mapId) {
        loadFromCloud('current');
      }
      fetchMindmapsList();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `artifacts/${appId}/users/${user.uid}/mindmaps/${mapId}`);
    }
  };

  const duplicateMindmap = async (mapId) => {
    if (!user || !db) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'mindmaps', mapId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const newMapId = 'map-' + Date.now();
        const newDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'mindmaps', newMapId);
        const newPayload = { 
          ...data, 
          title: (data.title || 'Untitled Map') + ' (Copy)',
          updatedAt: Date.now(),
          createdAt: Date.now()
        };
        await setDoc(newDocRef, newPayload);
        fetchMindmapsList();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `artifacts/${appId}/users/${user.uid}/mindmaps/${mapId}`);
    }
  };

  const createNewMap = () => {
    if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
    }
    setNodes([]);
    setLinks([]);
    setSelectedNodeIds(new Set());
    setViewOffset({ x: 0, y: 0 });
    viewOffsetStateRef.current = { x: 0, y: 0 };
    setZoom(1);
    zoomStateRef.current = 1;
    setConfirmReset(false);
    setCurrentMindmapId('current');
    setCurrentMapTitle('Draft Concept');
    
    setHistory([{ nodes: [], links: [] }]);
    setHistoryIndex(0);
    setCurrentView('canvas');
  };

  const handleCreateInitialNode = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const worldX = (rect.width / 2 - viewOffset.x) / zoom;
    const worldY = ((rect.height - 120) / 2 - viewOffset.y) / zoom;
    
    const newNode = {
      id: 'root-' + Date.now(),
      label: 'New Concept',
      detail: null,
      x: worldX,
      y: worldY,
      vx: 0,
      vy: 0,
      mode: 'general',
      isRoot: true,
      createdAt: Date.now()
    };
    
    const newNodes = [newNode];
    setNodes(newNodes);
    pushHistory(newNodes, links);
    setEditingNodeId(newNode.id);
    setEditingLabel('');
  };

  const resetToInitial = () => {
    createNewMap();
  };

  // --- Helpers ---
  const getNodeSize = useCallback((nodeId, isRoot) => {
    const connectionCount = links.filter(l => l.source === nodeId || l.target === nodeId).length;
    const baseSize = isRoot ? 28 : 20;
    return Math.min(baseSize + (connectionCount * 4), 60); 
  }, [links]);

  const toggleNodeSelection = (id) => {
    setSelectedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getModeColor = (node) => {
    if (node.isSynthesis) return '#10b981'; // Emerald
    return ALL_MODES[node.mode]?.color || '#94a3b8';
  };

  const nodeDepths = useMemo(() => {
    const depths = new Map();
    const adjacency = new Map();
    const childToParent = new Map();

    links.forEach(link => {
      if (!adjacency.has(link.source)) adjacency.set(link.source, []);
      adjacency.get(link.source).push(link.target);
      childToParent.set(link.target, link.source);
    });

    const queue = [];
    nodes.forEach(n => {
        if (n.isRoot || !childToParent.has(n.id)) {
            depths.set(n.id, 0);
            queue.push({ id: n.id, depth: 0 });
        }
    });

    while(queue.length > 0) {
      const { id, depth } = queue.shift();
      const children = adjacency.get(id) || [];
      children.forEach(childId => {
        if (!depths.has(childId)) {
          depths.set(childId, depth + 1);
          queue.push({ id: childId, depth: depth + 1 });
        }
      });
    }
    return depths;
  }, [nodes, links]);

  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set();
    const neighbors = new Set([hoveredNodeId]);
    links.forEach(link => {
      if (link.source === hoveredNodeId) neighbors.add(link.target);
      if (link.target === hoveredNodeId) neighbors.add(link.source);
    });
    return neighbors;
  }, [hoveredNodeId, links]);

  // --- SVG Export (Fixed & Polished) ---
  const exportAsSVG = () => {
    if (nodes.length === 0 || !containerRef.current) return;
    const padding = 150;
    const nodeGeometry = nodes.map(n => ({ x: n.x, y: n.y, r: getNodeSize(n.id, n.isRoot) }));
    const minX = Math.min(...nodeGeometry.map(n => n.x - n.r));
    const maxX = Math.max(...nodeGeometry.map(n => n.x + n.r));
    const minY = Math.min(...nodeGeometry.map(n => n.y - n.r));
    const maxY = Math.max(...nodeGeometry.map(n => n.y + n.r));
    const vbW = (maxX - minX) + padding * 2;
    const vbH = (maxY - minY) + padding * 2;

    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - padding} ${minY - padding} ${vbW} ${vbH}" width="${vbW}" height="${vbH}" style="background-color: #020617;">`;
    
    // Draw Links
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      if (source && target) {
        const isSynthesis = links.filter(l => l.target === target.id).length > 1;
        const color = isSynthesis ? "#10b981" : "#4f46e5";
        svgString += `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="${color}" stroke-width="2" stroke-dasharray="6,3" stroke-opacity="0.6" />`;
      }
    });

    // Draw Nodes
    nodes.forEach(node => {
      const r = getNodeSize(node.id, node.isRoot);
      const color = getModeColor(node);
      const depth = nodeDepths.get(node.id) ?? 0;
      
      const commonProps = `fill="#020617" stroke="${color}" stroke-width="1.5"`;

      // Draw Shape
      if (node.isSynthesis) {
        svgString += `<rect x="${node.x - r}" y="${node.y - r}" width="${r*2}" height="${r*2}" transform="rotate(45, ${node.x}, ${node.y})" rx="2" ${commonProps} />`;
      } else if (depth === 0) {
        // Hexagon
        const points = Array.from({length: 6}).map((_, i) => {
            const angle = (i * 60 - 30) * Math.PI / 180;
            return `${node.x + Math.cos(angle) * r},${node.y + Math.sin(angle) * r}`;
        }).join(' ');
        svgString += `<polygon points="${points}" ${commonProps} />`;
      } else if (depth === 1) {
        // Rounded Square
        svgString += `<rect x="${node.x - r}" y="${node.y - r}" width="${r*2}" height="${r*2}" rx="8" ${commonProps} />`;
      } else if (depth === 2) {
        // Pentagon
        const points = Array.from({length: 5}).map((_, i) => {
            const angle = (i * 72 - 18) * Math.PI / 180;
            return `${node.x + Math.cos(angle) * r},${node.y + Math.sin(angle) * r}`;
        }).join(' ');
        svgString += `<polygon points="${points}" ${commonProps} />`;
      } else {
        // Circle
        svgString += `<circle cx="${node.x}" cy="${node.y}" r="${r}" ${commonProps} />`;
      }

      // Internal Design Handle
      svgString += `<circle cx="${node.x}" cy="${node.y}" r="${r * 0.4}" fill="${color}" opacity="0.3" />`;

      // Text (Multiline)
      const words = node.label.split(' ');
      const maxLineLength = 12;
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        if ((currentLine + " " + words[i]).length <= maxLineLength) {
          currentLine += " " + words[i];
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }
      lines.push(currentLine);

      lines.forEach((line, i) => {
        const dy = i === 0 ? r + 24 : r + 24 + (i * 12);
        svgString += `<text x="${node.x}" y="${node.y + dy}" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="10" fill="white" style="text-transform: uppercase;">${line}</text>`;
      });
    });

    svgString += `</svg>`;
    const blob = new Blob([`<?xml version="1.0" standalone="no"?>\r\n`, svgString], {type:"image/svg+xml;charset=utf-8"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `mindflow-export-${Date.now()}.svg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  };

  // --- Physics ---
  const runSimulation = useCallback(() => {
    physicsRef.current = requestAnimationFrame(runSimulation);

    setNodes(prevNodes => {
      if (prevNodes.length === 0) {
        if (physicsRef.current) cancelAnimationFrame(physicsRef.current);
        physicsRef.current = null;
        return prevNodes;
      }

      const currentDraggedId = draggedNodeIdRef.current;
      let hasMovement = !!currentDraggedId;
      
      const newNodes = prevNodes.map(n => ({ ...n }));

      const friction = 0.70;
      const attraction = 0.05;
      
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      for (let i = 0; i < newNodes.length; i++) {
        const nodeA = newNodes[i];
        if (nodeA.id === currentDraggedId) continue;
        const sizeA = getNodeSize(nodeA.id, nodeA.isRoot);
        
        for (let j = i + 1; j < newNodes.length; j++) {
          const nodeB = newNodes[j];
          if (nodeB.id === currentDraggedId) continue;
          
          const sizeB = getNodeSize(nodeB.id, nodeB.isRoot);
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          let force = (repulsionStrength * 40) / distSq;
          if (dist < sizeA + sizeB + 50) force += (sizeA + sizeB + 50 - dist) * 0.8; 
          
          if (Math.abs(force) > 0.05) {
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              nodeA.vx += fx;
              nodeA.vy += fy;
              nodeB.vx -= fx;
              nodeB.vy -= fy;
          }
        }
      }

      links.forEach(link => {
        const source = newNodes.find(n => n.id === link.source);
        const target = newNodes.find(n => n.id === link.target);
        if (!source || !target) return;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = links.filter(l => l.target === target.id).length > 1 ? 140 : 220;
        const force = (dist - targetDist) * attraction;
        if (Math.abs(force) > 0.05) {
            if (source.id !== currentDraggedId) { source.vx += (dx / dist) * force; source.vy += (dy / dist) * force; }
            if (target.id !== currentDraggedId) { target.vx -= (dx / dist) * force; target.vy -= (dy / dist) * force; }
        }
      });

      let massX = centerX;
      let massY = centerY;
      
      if (newNodes.length > 0) {
          massX = newNodes.reduce((acc, n) => acc + n.x, 0) / newNodes.length;
          massY = newNodes.reduce((acc, n) => acc + n.y, 0) / newNodes.length;
      }

      const resultNodes = newNodes.map(node => {
        if (node.id === currentDraggedId) {
            hasMovement = true;
            const physNode = physicsNodesRef.current.find(n => n.id === currentDraggedId);
            if (physNode) {
              node.x = physNode.x;
              node.y = physNode.y;
              node.fx = physNode.fx;
              node.fy = physNode.fy;
            }
            node.vx = 0;
            node.vy = 0;
            return node;
        }
        
        if (node.fx !== undefined && node.fy !== undefined) {
            node.x = node.fx;
            node.y = node.fy;
            node.vx = 0;
            node.vy = 0;
            return node;
        }

        // Clamp gravity forces so ultra-wide 4K displays don't pull unpinned nodes with excessive force
        const rawGravX = (centerX - node.x) * 0.0003 + (massX - node.x) * 0.0001;
        const rawGravY = (centerY - node.y) * 0.0003 + (massY - node.y) * 0.0001;
        const gravX = Math.max(-0.5, Math.min(0.5, rawGravX));
        const gravY = Math.max(-0.5, Math.min(0.5, rawGravY));

        if (Math.abs(gravX) > 0.05) node.vx += gravX;
        if (Math.abs(gravY) > 0.05) node.vy += gravY;

        node.vx *= friction; node.vy *= friction;
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > 15) { node.vx = (node.vx / speed) * 15; node.vy = (node.vy / speed) * 15; }
        
        if (speed < 0.5) { 
          node.vx = 0; 
          node.vy = 0; 
        } else {
          hasMovement = true;
        }
        
        node.x += node.vx; node.y += node.vy;
        return node;
      });

      if (!hasMovement) {
        if (physicsRef.current) cancelAnimationFrame(physicsRef.current);
        physicsRef.current = null;
        return prevNodes; // Bail out!
      }
      return resultNodes;
    });
  }, [links, repulsionStrength, getNodeSize]);

  useEffect(() => {
    if (!physicsRef.current) {
      physicsRef.current = requestAnimationFrame(runSimulation);
    }
    return () => {
      if (physicsRef.current) {
        cancelAnimationFrame(physicsRef.current);
        physicsRef.current = null;
      }
    };
  }, [runSimulation, nodes.length]);

  const getWeekKey = () => {
    const msPerWeek = 1000 * 60 * 60 * 24 * 7;
    return `week_${Math.floor(Date.now() / msPerWeek)}`;
  };

  // --- Usage & Monetization Logic ---
  useEffect(() => {
    const checkUserStatus = async () => {
      const weekKey = getWeekKey();
      
      if (!user || user.isAnonymous) {
         // Load from local storage for anonymous
         const storedUsage = localStorage.getItem(`mindflow_usage_${weekKey}`);
         setDailyUsage(storedUsage ? parseInt(storedUsage) : 0);
         setSubscriptionTier('free');
         const storedTokens = localStorage.getItem('mindflow_tokens_used');
         setTokensUsed(storedTokens ? parseInt(storedTokens) : 0);
         return;
      }
      
      if (!db) return;
      
      // Check Pro Status
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        let userTier = 'free';
        let userTokens = 0;
        
        let shouldMergePending = false;
        let pendingData = null;
        if (user.email) {
            const pendingRef = doc(db, 'pending_licenses', user.email.toLowerCase());
            const pendingSnap = await getDoc(pendingRef);
            if (pendingSnap.exists()) {
                pendingData = pendingSnap.data();
                shouldMergePending = true;
                userTier = pendingData.subscriptionTier;
                // Delete pending immediately after reading
                await deleteDoc(pendingRef);
            }
        }
        
        if (userSnap.exists()) {
            const data = userSnap.data();
            if (shouldMergePending) {
                await setDoc(userRef, { subscriptionTier: userTier, licenseKey: pendingData.licenseKey }, { merge: true });
            } else {
                userTier = data.subscriptionTier || (data.isPro ? 'pro' : 'free');
            }
            userTokens = data.tokensUsed || 0;
            
            // Token reset logic
            if (userTier !== 'free') {
                const subStart = data.subscriptionStart || data.createdAt || Date.now();
                const lastReset = data.lastTokenReset || subStart;
                
                const subStartDate = new Date(subStart);
                const now = new Date();
                let cycleStart = new Date(subStartDate);
                cycleStart.setMonth(cycleStart.getMonth() + (now.getFullYear() - cycleStart.getFullYear()) * 12 + now.getMonth() - cycleStart.getMonth());
                
                if (cycleStart > now) {
                    cycleStart.setMonth(cycleStart.getMonth() - 1);
                }
                
                if (lastReset < cycleStart.getTime()) {
                    userTokens = 0;
                    await setDoc(userRef, { tokensUsed: 0, lastTokenReset: cycleStart.getTime(), subscriptionStart: subStart }, { merge: true });
                }
            }

            // Always sync the latest email
            if (user.email && data.email !== user.email.toLowerCase()) {
                 await setDoc(userRef, { email: user.email.toLowerCase() }, { merge: true });
            }
        } else {
            // Check if they had a local license and sync it
            const localTier = localStorage.getItem('mindflow_subscription_tier') || (localStorage.getItem('mindflow_is_pro') === 'true' ? 'pro' : 'free');
            const localLicense = localStorage.getItem('mindflow_license');
            if (shouldMergePending) {
                await setDoc(userRef, { subscriptionTier: userTier, licenseKey: pendingData.licenseKey, tokensUsed: 0, email: user.email ? user.email.toLowerCase() : null, displayName: user.displayName || null, createdAt: Date.now(), subscriptionStart: Date.now() }, { merge: true });
            } else if (localTier !== 'free' && localLicense) {
                await setDoc(userRef, { subscriptionTier: localTier, licenseKey: localLicense, tokensUsed: 0, email: user.email ? user.email.toLowerCase() : null, displayName: user.displayName || null, createdAt: Date.now(), subscriptionStart: Date.now() }, { merge: true });
                userTier = localTier;
                localStorage.removeItem('mindflow_is_pro');
                localStorage.removeItem('mindflow_subscription_tier');
                localStorage.removeItem('mindflow_license');
            } else {
                await setDoc(userRef, { subscriptionTier: 'free', tokensUsed: 0, email: user.email ? user.email.toLowerCase() : null, displayName: user.displayName || null, createdAt: Date.now() }, { merge: true });
            }
        }
        
        // If still free, check pending licenses by email via webhook
        if (userTier === 'free' && user.email) {
            try {
                const normalizedEmail = user.email.toLowerCase();
                const pendingRef = doc(db, 'pending_licenses', normalizedEmail);
                const pendingSnap = await getDoc(pendingRef);
                if (pendingSnap.exists()) {
                    const pd = pendingSnap.data();
                    userTier = pd.subscriptionTier || 'pro';
                    await setDoc(userRef, { subscriptionTier: userTier, licenseKey: pd.licenseKey || 'webhook-granted', subscriptionStart: pd.grantedAt || Date.now() }, { merge: true });
                    await deleteDoc(pendingRef);
                }
            } catch (err) {
                console.log("Could not check pending licenses:", err);
            }
        }

        setSubscriptionTier(userTier);
        setTokensUsed(userTokens);

        // Check Usage (Weekly)
        const usageRef = doc(db, 'users', user.uid, 'usage', weekKey);
        const usageSnap = await getDoc(usageRef);
        if (usageSnap.exists()) {
            setDailyUsage(usageSnap.data().count || 0);
        } else {
            setDailyUsage(0);
        }

        // Listen for real-time updates (e.g. from Gumroad webhooks)
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSubscriptionTier(data.subscriptionTier || (data.isPro ? 'pro' : 'free'));
                setTokensUsed(data.tokensUsed || 0);
            }
        });
        return unsubscribe;

      } catch (e) {
        console.error("Error checking user status:", e);
      }
    };
    const unsub = checkUserStatus();
    return () => {
        unsub.then(fn => { if (typeof fn === 'function') fn(); });
    };
  }, [user]);

  const PLUS_TOKEN_LIMIT = 100000;
  const PRO_TOKEN_LIMIT = 250000;

  const checkUsageLimit = () => {
    if (subscriptionTier !== 'free') {
      const limit = subscriptionTier === 'pro' ? PRO_TOKEN_LIMIT : PLUS_TOKEN_LIMIT;
      if (Number(tokensUsed) >= limit) {
        setShowUpgradeModal(true);
        return false;
      }
      return true;
    }
    
    if (Number(dailyUsage) >= globalConfig.WEEKLY_LIMIT) {
        setShowUpgradeModal(true);
        return false;
    }
    return true;
  };

  const trackUsage = async (newTokens = 0) => {
    // Track tokens if they are not free
    if (subscriptionTier !== 'free') {
      setTokensUsed(prev => {
        const updatedTokens = Number(prev) + Number(newTokens);
        if (user && db && !user.isAnonymous) {
            setDoc(doc(db, 'users', user.uid), { tokensUsed: updatedTokens }, { merge: true }).catch(console.error);
        } else {
            localStorage.setItem('mindflow_tokens_used', updatedTokens.toString());
        }
        return updatedTokens;
      });
      return;
    }

    // Otherwise standard free weekly increment
    setDailyUsage(prev => {
        const newCount = prev + 1;
        
        const weekKey = getWeekKey();
        
        if (user && db && !user.isAnonymous) {
            try {
              const usageRef = doc(db, 'users', user.uid, 'usage', weekKey);
              setDoc(usageRef, { count: newCount }, { merge: true }).catch(console.error);
            } catch (e) {
              console.error("Error tracking free usage:", e);
            }
        } else {
            localStorage.setItem(`mindflow_usage_${weekKey}`, newCount.toString());
        }

        return newCount;
    });
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleVerifyLicense = async (licenseKey: string) => {
    if (!user || user.isAnonymous) {
      setShowUpgradeModal(false);
      setShowAuthModal(true);
      throw new Error("You must be logged in to verify a license.");
    }
    try {
      let permalink = 'mindflov';
      if (globalConfig?.PRO_LINK) {
        try {
           const url = new URL(globalConfig.PRO_LINK);
           if (url.pathname.startsWith('/l/')) {
               permalink = url.pathname.split('/l/')[1].split('/')[0];
           }
        } catch(e){}
      }
      const resp = await fetch('/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_permalink: permalink,
          license_key: licenseKey
        })
      });
      const data = await resp.json();
      
      if (!resp.ok) {
        // Handle common HTTP error codes
        if (resp.status === 404) {
           throw new Error("License key not found. Please check your Gumroad receipt and ensure it's for the correct product.");
        } else if (resp.status === 400) {
           throw new Error("Invalid request or product configuration. Please contact support if this persists.");
        } else if (resp.status >= 500) {
           throw new Error("Gumroad services are currently experiencing issues. Please try again later.");
        }
        throw new Error(data.message || 'License verification failed. Please check your key and try again.');
      }
      
      if (!data.success) {
        if (data.message?.includes('does not exist')) {
            throw new Error("Invalid license key. Please verify the key from your receipt.");
        }
        if (data.message?.includes('refunded')) {
            throw new Error("This license has been refunded and is no longer valid.");
        }
        if (data.message?.includes('disabled')) {
            throw new Error("This license has been disabled by the creator.");
        }
        throw new Error(data.message || 'We could not verify your license. Please try again.');
      }
      
      if (data.purchase?.refunded) {
        throw new Error("This license has been refunded and is no longer valid.");
      }
      
      if (data.purchase?.subscription_ended_at) {
         const endedAt = new Date(data.purchase.subscription_ended_at).getTime();
         if (Date.now() > endedAt) {
             throw new Error("This subscription has ended. Please renew on Gumroad to continue.");
         }
      }

      if (data.purchase?.subscription_failed_at) {
         throw new Error("Subscription payment failed. Please update your payment method on Gumroad.");
      }
      
      const variantStr = (data.purchase?.variants || '').toLowerCase();
      const permalinkStr = (data.purchase?.product_permalink || '').toLowerCase();
      const nameStr = (data.purchase?.product_name || '').toLowerCase();
      const combinedPurchaseStr = `${variantStr} ${permalinkStr} ${nameStr}`;
      
      let tier = 'plus';
      if (combinedPurchaseStr.includes('pro') || combinedPurchaseStr.includes('advanced') || combinedPurchaseStr.includes('premium')) {
          tier = 'pro';
      } else if (combinedPurchaseStr.includes('plus') || combinedPurchaseStr.includes('starter') || combinedPurchaseStr.includes('basic')) {
          tier = 'plus';
      }
      
      // success
      setSubscriptionTier(tier);
      if (user && db && !user.isAnonymous) {
        await setDoc(doc(db, 'users', user.uid), { subscriptionTier: tier, licenseKey }, { merge: true });
      }
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  // --- API ---
  const callGeminiWithBackoff = async (fn, retries = 2) => {
    const delays = [1000, 2000];
    let lastError;
    for (let i = 0; i <= retries; i++) {
      if (abortControllerRef.current?.signal?.aborted) throw new Error('Aborted');
      try {
        return await fn();
      } catch (e) {
        if (abortControllerRef.current?.signal?.aborted) throw new Error('Aborted');
        lastError = e;
        if (i < retries) {
          console.warn(`Gemini API error, retrying in ${delays[i]}ms...`, e);
          await new Promise<void>(resolve => {
              const timeoutId = setTimeout(resolve, delays[i]);
              if (abortControllerRef.current?.signal) {
                  abortControllerRef.current.signal.addEventListener('abort', () => {
                     clearTimeout(timeoutId);
                     resolve();
                  }, { once: true });
              }
          });
        }
      }
    }
    throw lastError;
  };

  const generateWithAi = async (params: any) => {
    const modeInfo = MODES[currentMode];
    const enriched = {
      ...params,
      telemetry: {
        actionType: params?.actionType ?? 'expand',
        contextRole: globalRole,
        modeKey: currentMode,
        modeLabel: modeInfo?.label ?? currentMode,
        mapId: currentMindmapId,
        ...(params?.telemetry ?? {}),
      },
    };
    delete enriched.actionType;
    return await callAiEndpoint(enriched, abortControllerRef.current?.signal ?? null);
  };

  const fetchKeywords = async (concepts, includeDetail = false, parentContextLabels = []) => {
    if (!checkUsageLimit()) return [];
    
    const modeInfo = MODES[currentMode];
    
    let systemInstruction;
    let responseSchema;
    
    const primerStr = globalPrimer.trim() ? `\n\nCRITICAL PROJECT CONTEXT:\n${globalPrimer.trim()}\nAll generated ideas MUST strictly align with and adapt to this context.` : '';

    if (includeDetail) {
        systemInstruction = `You are a creative brainstorming assistant. Mode: ${modeInfo.label}. Goal: ${modeInfo.prompt}.${primerStr} \n\nReturn a JSON object with a "keywords" array containing exactly ${genCount} items. Each item must be an object with: \n1. "keyword": A short, creative concept (MAXIMUM ${maxWords} words). \n2. "detail": A concise explanation (10-20 words) expanding on the concept.`;
        responseSchema = {
            type: Type.OBJECT,
            properties: {
                keywords: {
                    type: Type.ARRAY,
                    items: { 
                      type: Type.OBJECT,
                      properties: {
                        keyword: { type: Type.STRING },
                        detail: { type: Type.STRING }
                      },
                      required: ["keyword", "detail"]
                    }
                }
            }
        };
    } else {
        systemInstruction = `You are a creative brainstorming assistant. Mode: ${modeInfo.label}. Goal: ${modeInfo.prompt}.${primerStr} \n\nReturn a JSON object with a "keywords" array containing exactly ${genCount} short, creative concepts (MAXIMUM ${maxWords} word${maxWords > 1 ? 's' : ''} each).`;
        responseSchema = {
            type: Type.OBJECT,
            properties: {
                keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        };
    }

    try {
      let contextStr = parentContextLabels.length > 0 ? ` (Taking into account upstream parent context: ${parentContextLabels.join(' -> ')})` : '';
      const { data, tokens } = await callGeminiWithBackoff(async () => {
          const response = await generateWithAi({
              model: modelSettings.expansion,
              actionType: 'expand',
              contents: `Generate related concepts for: ${concepts.join(' + ')}${contextStr}`,
              config: {
                  systemInstruction,
                  responseMimeType: "application/json",
                  responseSchema
              }
          });
          
          let text = response.text;
          if (!text) throw new Error("Empty response from AI");
          const tokens = response.tokens || 0;
          
          // Cleanup potential markdown wrapping
          text = text.trim();
          if (text.startsWith('```json')) {
              text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (text.startsWith('```')) {
              text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          try {
              const json = JSON.parse(text);
              return { data: json.keywords || [], tokens };
          } catch (e) {
              console.error("JSON Parse Error", text);
              throw new Error("Failed to parse AI response");
          }
      });
      
      await trackUsage(tokens);
      return data;
    } catch (e) {
      throw e;
    }
  };

  const fetchAnalysis = async (type) => {
    if (selectedNodeIds.size === 0) return;
    if (!checkUsageLimit()) return;

    abortControllerRef.current = new AbortController();
    setAnalysisLoading(true);
    setAnalysisLoadingType(type);
    
    // Paid plan is the source of truth for feature gating and AI limits.
  useEffect(() => {
    if (billing.loading) return;
    setSubscriptionTier(prev => (billing.tier !== prev ? billing.tier : prev));
  }, [billing.tier, billing.loading]);

  // Confirm the upgrade when Paddle sends the customer back to the app.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setPurchaseSuccess(true);
      void billing.refresh();
      params.delete('checkout');
      const next = params.toString();
      window.history.replaceState({}, '', next ? `${window.location.pathname}?${next}` : window.location.pathname);
    }
  }, []);

  const selectedNodesData = nodes.filter(n => selectedNodeIds.has(n.id));
    const concepts = selectedNodesData.map(n => n.label).join(", ");
    const modeInfo = MODES[currentMode];
    const primerStr = globalPrimer.trim() ? `\n\nCRITICAL PROJECT CONTEXT: ${globalPrimer.trim()} (Ensure the output adapts to this context).` : '';
    
    let prompt = "";
    if (type === 'insight') {
      prompt = `Provide a profound, strategic insight or definition for the concept: "${concepts}". Mode: ${modeInfo.label}. Context: ${modeInfo.prompt}.${primerStr} Focus on the 'why' and 'value'. Keep it under 60 words.`;
    } else if (type === 'plan') {
      prompt = `Create a 3-step actionable micro-plan to execute or explore the concept: "${concepts}". Mode: ${modeInfo.label}. Context: ${modeInfo.prompt}.${primerStr} Keep steps actionable and concise (max 15 words per step). Format as a numbered list.`;
    }

    try {
      const { text: result, tokens } = await callGeminiWithBackoff(async () => {
          const response = await generateWithAi({
            model: type === 'insight' ? modelSettings.insight : modelSettings.plan,
            actionType: type === 'insight' ? 'insight' : 'plan',
            contents: prompt
          });
          const tokens = response.tokens || 0;
          return { text: response.text, tokens };
      });
      if (!result) throw new Error("Empty analysis result");
      
      setNodes(prev => {
        const newNodes = prev.map(n => {
          if (selectedNodeIds.has(n.id)) {
            if (type === 'insight') return { ...n, insightData: result.trim() };
            if (type === 'plan') return { ...n, planData: result.trim() };
          }
          return n;
        });
        pushHistory(newNodes, links);
        return newNodes;
      });
      await trackUsage(tokens);
    } catch (e) {
      setError("Analysis failed.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setAnalysisLoading(false);
      setAnalysisLoadingType(null);
    }
  };

  const performNeuralAnalysis = async () => {
    if (nodes.length < 2) return;
    if (!checkUsageLimit()) return;

    abortControllerRef.current = new AbortController();
    setAnalysisLoading(true);
    setError(null);
    try {
      const nodeDataList = nodes.map(n => ({ id: n.id, label: n.label }));
      const existingLinks = links.map(l => ({ source: l.source, target: l.target }));
      const primerStr = globalPrimer.trim() ? `\n\nCRITICAL PROJECT CONTEXT:\n${globalPrimer.trim()}\nThe discovered synergies MUST be relevant to this context.` : '';
      
      const systemInstruction = `You are a data correlation engine. Analyze the provided nodes and discover non-obvious, highly synergistic connections that do not currently exist in the existing_links.${primerStr} \n\nOutput a JSON array of connections. Each connection must be an object with "source" (node id), "target" (node id), and "label" (max 4 words capturing the synergy). Only provide strong connections (max 5 new connections). Do not duplicate existing links.`;
      
      const prompt = `Nodes: ${JSON.stringify(nodeDataList)} \nExisting Links: ${JSON.stringify(existingLinks)}`;

      const result = await callGeminiWithBackoff(async () => {
          const response = await generateWithAi({
              model: modelSettings.neural,
              actionType: 'neural_analysis',
              contents: prompt,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      source: { type: Type.STRING },
                      target: { type: Type.STRING },
                      label: { type: Type.STRING }
                    },
                    required: ["source", "target", "label"]
                  }
                }
              }
          });
          const tokens = response.tokens || 0;
          return { text: response.text, tokens };
      });

      if (!result.text) throw new Error("Empty analysis result");
      
      let text = result.text.trim();
      if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');

      const newConnections = JSON.parse(text);
      if (Array.isArray(newConnections) && newConnections.length > 0) {
        setLinks(prev => {
          const updatedLinks = [...prev];
          let added = 0;
          for (const conn of newConnections) {
            // Verify nodes exist
            if (!nodesRef.current.find(n => n.id === conn.source) || !nodesRef.current.find(n => n.id === conn.target)) continue;
            // Verify link doesn't already exist
            const exists = updatedLinks.some(l => 
              (l.source === conn.source && l.target === conn.target) || 
              (l.source === conn.target && l.target === conn.source)
            );
            if (!exists) {
              updatedLinks.push({ source: conn.source, target: conn.target, label: conn.label });
              added++;
            }
          }
          if (added > 0) pushHistory(nodesRef.current, updatedLinks);
          return updatedLinks;
        });
      }
      await trackUsage(result.tokens);
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "Neural Analysis failed.";
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) msg = "Rate limit exceeded. Please wait a moment and try again.";
      setError(`AI analysis failed: ${msg}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const addCombinationIdeas = async () => {
    if (selectedNodeIds.size === 0 || loading) return;
    
    abortControllerRef.current = new AbortController();
    
    setLoading(true); setError(null);
    setGeneratingNodeIds(new Set(selectedNodeIds));
    const selectedNodesData = nodes.filter(n => selectedNodeIds.has(n.id));
    const parentLabels = selectedNodesData.map(n => n.label);
    const parentIds = Array.from(selectedNodeIds);
    let upstreamLabels = [];
    if (includeParentContext) {
      const upstreamIds = new Set();
      links.forEach(l => {
         if (selectedNodeIds.has(l.target)) {
            upstreamIds.add(l.source);
         }
      });
      upstreamLabels = nodes.filter(n => upstreamIds.has(n.id)).map(n => n.label);
    }
    try {
      const needsDetail = true;
      const keywords = await fetchKeywords(parentLabels, needsDetail, upstreamLabels);
      const existing = new Set(nodes.map(n => n.label.toLowerCase()));
      // Handle both string (legacy) and object (new) formats for backward compatibility if needed, 
      // though fetchKeywords is updated to return objects.
      const filtered = keywords.filter(k => {
        const word = typeof k === 'string' ? k : (k?.keyword || "");
        return word && !existing.has(word.toLowerCase());
      });
      
      if (filtered.length === 0) {
         setError("No new ideas generated.");
         setTimeout(() => setError(null), 3000);
         setLoading(false);
         setGeneratingNodeIds(new Set());
         return;
      }

      const avgX = selectedNodesData.reduce((acc, n) => acc + n.x, 0) / selectedNodesData.length;
      const avgY = selectedNodesData.reduce((acc, n) => acc + n.y, 0) / selectedNodesData.length;
      
      const radius = 180; // Distance from center to pop to
      const angleStep = (2 * Math.PI) / filtered.length;
      const currentRotation = rotationOffset;
      
      // Update rotation for next batch to avoid overlap
      setRotationOffset(prev => prev + (Math.PI / 4));

      const generatedIds = [];
      const baseTime = Date.now();

      filtered.forEach((item, i) => {
        const id = `node-${baseTime}-${i}`;
        generatedIds.push(id);

        setTimeout(() => {
          const angle = currentRotation + (i * angleStep);
          // Start slightly offset from center
          const startX = avgX + Math.cos(angle) * 10;
          const startY = avgY + Math.sin(angle) * 10;
          
          // Target velocity vector (shooting outwards)
          const popForce = 12;
          const vx = Math.cos(angle) * popForce;
          const vy = Math.sin(angle) * popForce;

          let label = typeof item === 'string' ? item : (item?.keyword || "Concept");
          let detail = typeof item === 'string' ? null : (item?.detail || null);

          // Heuristic: Split "Title: Description" if label is longish
          if (label.includes(':') && label.length > 20) {
              const parts = label.split(':');
              if (parts[0].length < 50) { // If the part before colon is reasonable as a title
                  if (!detail) detail = parts.slice(1).join(':').trim();
                  label = parts[0].trim();
              }
          }

          // Fallback: If label is excessively long (likely an error), truncate it and move full text to detail
          if (label.length > 50) {
            if (!detail) detail = label;
            label = label.substring(0, 47) + "...";
          }

          setNodes(prev => [...prev, { 
            id, 
            label,
            detail,
            x: startX, 
            y: startY, 
            vx: vx, 
            vy: vy, 
            isSynthesis: parentIds.length > 1, 
            createdAt: Date.now(), 
            mode: currentMode 
          }]);
          setLinks(prev => [...prev, ...parentIds.map(pId => ({ source: pId, target: id }))]);
        }, i * 100);
      });
      
      // Push to history after animation
      setTimeout(() => {
        pushHistory(nodesRef.current, linksRef.current);
      }, filtered.length * 100 + 50);

      // Track camera to newly generated content
      setTimeout(() => {
        const trackIds = new Set([...parentIds, ...generatedIds]);
        const targetNodes = nodesRef.current.filter(n => trackIds.has(n.id));
        animateCameraToNodes(targetNodes);
      }, filtered.length * 100 + 600);

    } catch (err: any) { 
      if (err.message === 'Aborted') {
          console.log('Generation cancelled');
      } else {
          let msg = err.message || "Neural Link failed.";
          if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) msg = "Rate limit exceeded. Please wait a moment and try again.";
          console.error(err);
          setError(`AI generation failed: ${msg}`); 
          setTimeout(() => setError(null), 5000);
      }
    } finally { 
      setLoading(false); 
      setGeneratingNodeIds(new Set());
      setSelectedNodeIds(new Set());
    }
  };

  const convergeSelectedNodes = async () => {
    if (selectedNodeIds.size < 2 || loading) return;
    if (!checkUsageLimit()) return;
    
    abortControllerRef.current = new AbortController();
    setLoading(true); setError(null);
    setGeneratingNodeIds(new Set(selectedNodeIds));
    
    const selectedNodesData = nodes.filter(n => selectedNodeIds.has(n.id));
    const concepts = selectedNodesData.map(n => n.label).join(", ");
    const modeInfo = MODES[currentMode];
    const primerStr = globalPrimer.trim() ? `\n\nCRITICAL PROJECT CONTEXT:\n${globalPrimer.trim()}` : '';
    
    const prompt = `Synthesize and converge the following concepts into a single, unified new concept or idea: "${concepts}". 
Mode: ${modeInfo.label}. Context: ${modeInfo.prompt}.${primerStr}

Return a JSON object with:
1. "keyword": The unified concept name (max 5 words).
2. "detail": A concise explanation (20-40 words) of how these ideas combine and the value of this convergence.`;

    try {
      const { text: result, tokens } = await callGeminiWithBackoff(async () => {
          const response = await generateWithAi({
            model: modelSettings.expansion,
            actionType: 'converge',
            contents: prompt,
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyword: { type: Type.STRING },
                    detail: { type: Type.STRING }
                },
                required: ["keyword", "detail"]
            }
          });
          const tokens = response.tokens || 0;
          return { text: response.text, tokens };
      });
      
      if (!result) throw new Error("Empty convergence result");
      
      let parsed;
      try {
         parsed = JSON.parse(result);
      } catch (e) {
         const match = result.match(/\{[\s\S]*\}/);
         if (match) parsed = JSON.parse(match[0]);
         else throw new Error("Invalid JSON");
      }
      
      if (!parsed.keyword) throw new Error("Missing keyword in response");
      
      const avgX = selectedNodesData.reduce((acc, n) => acc + n.x, 0) / selectedNodesData.length;
      const avgY = selectedNodesData.reduce((acc, n) => acc + n.y, 0) / selectedNodesData.length;
      
      const newNodeId = `node-${Date.now()}`;
      const newNode = {
         id: newNodeId,
         label: parsed.keyword,
         detail: parsed.detail,
         x: avgX,
         y: avgY + 200, // Place it below the average center
         vx: 0, vy: 0,
         mode: currentMode
      };
      
      const newLinks = selectedNodesData.map(n => ({
         source: n.id,
         target: newNodeId,
         id: `link-${n.id}-${newNodeId}`
      }));
      
      const updatedNodes = [...nodes, newNode];
      const updatedLinks = [...links, ...newLinks];
      
      setNodes(updatedNodes);
      setLinks(updatedLinks);
      pushHistory(updatedNodes, updatedLinks);
      
      // Select the new node
      setSelectedNodeIds(new Set([newNodeId]));
      
      trackUsage(tokens);
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'Aborted') {
          console.error("Convergence error:", err);
          setError(err.message || "Failed to converge ideas.");
          setTimeout(() => setError(null), 3000);
      }
    } finally {
      setLoading(false);
      setGeneratingNodeIds(new Set());
    }
  };

  const generateHierarchicalText = () => {
    const adjacency = new Map();
    const childToParent = new Map();
    
    // Build adjacency list
    links.forEach(link => {
      if (!adjacency.has(link.source)) adjacency.set(link.source, []);
      adjacency.get(link.source).push(link.target);
      childToParent.set(link.target, link.source);
    });

    // Find roots (nodes with no parents or explicitly marked as root)
    const roots = nodes.filter(n => n.isRoot || !childToParent.has(n.id));
    const visited = new Set();
    let output = "# Mindflov Concept Export\n\n";

    const traverse = (nodeId, depth) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      // Visual Hierarchy logic
      if (depth === 0) {
        output += `## 🟢 Root: **${node.label}**\n`;
      } else if (depth === 1) {
        output += `### 🔹 Module: **${node.label}**\n`;
      } else {
        const indent = "  ".repeat(depth - 2);
        output += `${indent}- **${node.label}**\n`;
      }

      if (node.detail) {
        const indent = depth < 2 ? "" : "  ".repeat(depth - 2) + "  ";
        output += `${indent}> _${node.detail}_\n\n`;
      } else if (depth < 2) {
        output += "\n";
      }

      const children = adjacency.get(nodeId) || [];
      children.forEach(childId => traverse(childId, depth + 1));
    };

    roots.forEach(root => traverse(root.id, 0));
    
    // Catch any disconnected islands not reached by roots
    let hasIslands = false;
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        if (!hasIslands) {
            output += "\n---\n## 🧩 Disconnected Concepts\n";
            hasIslands = true;
        }
        traverse(node.id, 0);
      }
    });

    return output;
  };

  const handleTxtExport = () => {
    const text = generateHierarchicalText();
    const file = new Blob([text], {type: 'text/plain'});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "mindflow-hierarchy.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  };

  const generateSynthesizedDocument = async () => {
    if (!checkUsageLimit()) return;
    setSynthesisLoading(true);
    abortControllerRef.current = new AbortController();
    
    const mindMapText = generateMarkdownText();
    const modeInfo = MODES[currentMode];
    
    let prompt = `Synthesize the following provided content into a cohesive, creative, and professional document.
The content was generated using the "${modeInfo.label}" strategy. Ensure the resulting document reflects this strategic angle.

IMPORTANT INSTRUCTIONS:
1. The document MUST ONLY discuss the content provided below. 
2. Do NOT mention 'Mindflov', 'mind map', 'nodes', or the structural nature of the data. 
3. Do NOT provide meta-commentary about how it was generated. Write it as a seamless, standalone piece of content.
4. Seamlessly integrate the detailed notes, insights, visual metaphors, and action plans provided in the content into the narrative without explicitly labeling them as "Insight" or "Action Plan".`;

    if (synthesisContext.trim()) {
       prompt += `\n\nADDITIONAL PROJECT CONTEXT & GOALS:\n${synthesisContext.trim()}`;
    }

    prompt += `\n\nContent:\n${mindMapText}`;

    try {
      const { text } = await callGeminiWithBackoff(async () => {
        const response = await generateWithAi({
          model: modelSettings.expansion,
          actionType: 'synthesis',
          contents: prompt
        });
        return { text: response.text, tokens: response.tokens || 0 };
      });
      setSynthesizedDoc(text);
    } catch (err: any) {
      if (err.message !== 'Aborted') {
        console.error(err);
        let msg = err.message;
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) msg = "Rate limit exceeded. Please wait a moment and try again.";
        setError(`Synthesis failed: ${msg}`);
        setTimeout(() => setError(null), 5000);
      }
    } finally {
      setSynthesisLoading(false);
    }
  };

  const generateMarkdownText = () => {
    const adjacency = new Map();
    const childToParent = new Map();
    
    links.forEach(link => {
      if (!adjacency.has(link.source)) adjacency.set(link.source, []);
      adjacency.get(link.source).push(link.target);
      childToParent.set(link.target, link.source);
    });

    const roots = nodes.filter(n => n.isRoot || !childToParent.has(n.id));
    const visited = new Set();
    let output = "# Mindflov Concept Export\n\n";

    const traverse = (nodeId, depth) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const indent = "  ".repeat(depth);
      output += `${indent}- **${node.label}**\n`;

      if (node.detail) {
        const detailLines = node.detail.split('\n').filter(l => l.trim() !== '');
        detailLines.forEach(line => {
          output += `${indent}  > ${line}\n`;
        });
      }

      const children = adjacency.get(nodeId) || [];
      children.forEach(childId => traverse(childId, depth + 1));
    };

    roots.forEach(root => traverse(root.id, 0));
    
    nodes.forEach(n => {
       if (n.insightData) output += `\n\n## Deep Insight for ${n.label}\n\n${n.insightData}\n`;
       if (n.planData) output += `\n\n## Action Plan for ${n.label}\n\n${n.planData}\n`;
    });

    return output;
  };

  const handleMdExport = () => {
    const text = generateMarkdownText();
    const file = new Blob([text], {type: 'text/markdown'});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "mindflow-export.md";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  };

  const exportAsPNG = () => {
    if (nodes.length === 0 || !containerRef.current) return;
    
    // Create a temporary canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate bounding box of all nodes
    const nodeGeometry = nodes.map(n => ({ x: n.x, y: n.y, r: getNodeSize(n.id, n.isRoot) }));
    const minX = Math.min(...nodeGeometry.map(n => n.x - n.r));
    const maxX = Math.max(...nodeGeometry.map(n => n.x + n.r));
    const minY = Math.min(...nodeGeometry.map(n => n.y - n.r));
    const maxY = Math.max(...nodeGeometry.map(n => n.y + n.r));
    
    const padding = 100;
    const width = (maxX - minX) + padding * 2;
    const height = (maxY - minY) + padding * 2;

    // Set canvas size (high resolution)
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // Fill background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Translate to center content
    ctx.translate(-minX + padding, -minY + padding);

    // Draw Links
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      if (source && target) {
        const isSynthesis = links.filter(l => l.target === target.id).length > 1;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = isSynthesis ? "#10b981" : "#4f46e5";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
      }
    });

    // Draw Nodes
    nodes.forEach(node => {
      const r = getNodeSize(node.id, node.isRoot);
      const color = getModeColor(node);
      const depth = nodeDepths.get(node.id) ?? 0;
      
      ctx.fillStyle = '#020617';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      if (node.isSynthesis) {
        // Rotated Rect
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.rotate(45 * Math.PI / 180);
        // ctx.roundRect is not supported in all envs, fallback to rect with manual rounded corners or just rect
        // For simplicity using rect with lineJoin round
        ctx.lineJoin = "round";
        ctx.rect(-r, -r, r*2, r*2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (depth === 0) {
        // Hexagon
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60 - 30) * Math.PI / 180;
            const px = node.x + Math.cos(angle) * r;
            const py = node.y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (depth === 1) {
        // Rounded Square
        // Using arcTo for rounded corners manually or just rect with round join
        const rr = r; 
        ctx.beginPath();
        ctx.roundRect(node.x - rr, node.y - rr, rr*2, rr*2, 8);
        ctx.fill();
        ctx.stroke();
      } else if (depth === 2) {
        // Pentagon
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72 - 18) * Math.PI / 180;
            const px = node.x + Math.cos(angle) * r;
            const py = node.y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Circle
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }

      // Internal Design Handle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.4, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Draw Label (Multiline)
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const words = node.label.split(' ');
      const maxLineLength = 12;
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        if ((currentLine + " " + words[i]).length <= maxLineLength) {
          currentLine += " " + words[i];
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }
      lines.push(currentLine);

      lines.forEach((line, i) => {
        const dy = i === 0 ? r + 24 : r + 24 + (i * 12);
        // Shadow
        ctx.shadowColor = "black";
        ctx.shadowBlur = 2;
        ctx.fillText(line.toUpperCase(), node.x, node.y + dy);
        ctx.shadowBlur = 0;
      });
    });

    // Download
    const link = document.createElement('a');
    link.download = `mindflow-export-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleMouseDown = (e) => {
    setContextMenu(null);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    startMousePos.current = { x: e.clientX, y: e.clientY };
    
    // Check for Box Selection (Ctrl/Cmd + Drag on background)
    if ((e.metaKey || e.ctrlKey) && e.target && (e.target.tagName === 'svg' || e.target.tagName === 'rect' || e.target.tagName === 'div')) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
      return;
    }

    if (e.target && (e.target.tagName === 'svg' || e.target.tagName === 'rect' || e.target.tagName === 'MAIN' || e.target.id === 'canvas-main')) {
      setIsPanning(true);
    }
  };
  
  const handleMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    const rawDx = e.clientX - lastMousePos.current.x;
    const rawDy = e.clientY - lastMousePos.current.y;
    const currentZoom = zoomStateRef.current;
    const dx = rawDx / currentZoom;
    const dy = rawDy / currentZoom;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    if (selectionBoxRef.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setSelectionBox(prev => prev ? ({ ...prev, currentX: x, currentY: y }) : null);
      }
    } else if (isPanningRef.current) {
      const nextX = viewOffsetStateRef.current.x + rawDx;
      const nextY = viewOffsetStateRef.current.y + rawDy;
      viewOffsetStateRef.current = { x: nextX, y: nextY };
      
      if (mainGroupRef.current) mainGroupRef.current.setAttribute('transform', `translate(${nextX}, ${nextY}) scale(${currentZoom})`);
      if (bgGridRef.current) bgGridRef.current.style.transform = `translate(${nextX}px, ${nextY}px) scale(${currentZoom})`;
    } else if (draggedNodeIdRef.current) {
      const node = physicsNodesRef.current.find(n => n.id === draggedNodeIdRef.current);
      if (node) {
          const currentFx = node.fx !== undefined ? node.fx : node.x;
          const currentFy = node.fy !== undefined ? node.fy : node.y;
          node.fx = currentFx + dx;
          node.fy = currentFy + dy;
          node.x = node.fx;
          node.y = node.fy;
      }
      if (!physicsRef.current) {
          physicsRef.current = requestAnimationFrame(runSimulation);
      }
    } else if (linkingNodeIdRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - viewOffsetStateRef.current.x) / currentZoom;
      const worldY = (e.clientY - rect.top - viewOffsetStateRef.current.y) / currentZoom;
      setTempLinkEnd({ x: worldX, y: worldY });
    }
  }, [runSimulation]);

  const handleMouseUp = useCallback((e: MouseEvent | React.MouseEvent) => {
    const distance = Math.hypot(e.clientX - startMousePos.current.x, e.clientY - startMousePos.current.y);
    if (distance < 5 && isPanningRef.current) {
        if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
          if (abortControllerRef.current) abortControllerRef.current.abort();
          setSelectedNodeIds(new Set());
        }
    }

    if (selectionBoxRef.current) {
      const x1 = Math.min(selectionBoxRef.current.startX, selectionBoxRef.current.currentX);
      const x2 = Math.max(selectionBoxRef.current.startX, selectionBoxRef.current.currentX);
      const y1 = Math.min(selectionBoxRef.current.startY, selectionBoxRef.current.currentY);
      const y2 = Math.max(selectionBoxRef.current.startY, selectionBoxRef.current.currentY);

      const newSelection = new Set<string>();
      nodesRef.current.forEach(node => {
         const screenX = node.x * zoomStateRef.current + viewOffsetStateRef.current.x;
         const screenY = node.y * zoomStateRef.current + viewOffsetStateRef.current.y;
         if (screenX >= x1 && screenX <= x2 && screenY >= y1 && screenY <= y2) {
           newSelection.add(node.id);
         }
      });
      setSelectedNodeIds(newSelection);
      setSelectionBox(null);
    } else if (draggedNodeIdRef.current) {
      setNodes([...physicsNodesRef.current]);
      pushHistory(physicsNodesRef.current, linksRef.current);
    }

    if (isPanningRef.current) {
      setViewOffset(viewOffsetStateRef.current);
    }

    setIsPanning(false); 
    setDraggedNodeId(null); 
    setLinkingNodeId(null); 
    setTempLinkEnd(null); 
  }, [pushHistory]);

  // Global window drag & pan listeners to support smooth movement across large (e.g. 4K) screens
  useEffect(() => {
    const onGlobalMouseMove = (e: MouseEvent) => {
      if (draggedNodeIdRef.current || isPanningRef.current || linkingNodeIdRef.current || selectionBoxRef.current) {
        handleMouseMove(e);
      }
    };

    const onGlobalMouseUp = (e: MouseEvent) => {
      if (draggedNodeIdRef.current || isPanningRef.current || linkingNodeIdRef.current || selectionBoxRef.current) {
        handleMouseUp(e);
      }
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
         e.preventDefault();
         const rect = containerRef.current?.getBoundingClientRect();
         if (!rect) return;
         
         // Calculate screen center in world coordinates
         const centerX = (rect.width / 2 - viewOffset.x) / zoom;
         const centerY = (rect.height / 2 - viewOffset.y) / zoom;
         
         const newNode = {
            id: `node-${Date.now()}`,
            label: "New Concept",
            x: centerX,
            y: centerY,
            vx: 0,
            vy: 0,
            isRoot: nodes.length === 0,
            fx: centerX, // Pinned
            fy: centerY  // Pinned
         };
         
         setNodes(prev => [...prev, newNode]);
         setEditingNodeId(newNode.id);
         setEditingLabel("New Concept");
         setSelectedNodeIds(new Set([newNode.id]));
         return;
      }

      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.size > 0) {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
           const newNodes = nodesRef.current.filter(n => !selectedNodeIds.has(n.id));
           const newLinks = linksRef.current.filter(l => !selectedNodeIds.has(l.source) && !selectedNodeIds.has(l.target));
           
           setNodes(newNodes);
           setLinks(newLinks);
           pushHistory(newNodes, newLinks);
           
           setSelectedNodeIds(new Set());
        }
      }

      if (e.key === 'Escape') {
          if (abortControllerRef.current) abortControllerRef.current.abort();
          setSelectedNodeIds(new Set());
          setEditingNodeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, undo, redo, pushHistory]);

  const animateCameraToNodes = useCallback((targetNodes) => {
    if (targetNodes.length === 0 || !containerRef.current) return;
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    targetNodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x;
      if (n.y > maxY) maxY = n.y;
    });

    const padding = Math.max(100, Math.min(200, targetNodes.length * 10)); // Dynamic padding
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = maxX - minX;
    const height = maxY - minY;

    const clientWidth = containerRef.current.clientWidth;
    const clientHeight = containerRef.current.clientHeight;

    const zoomX = clientWidth / (width || 1);
    const zoomY = clientHeight / (height || 1);
    const targetZoom = Math.min(zoomX, zoomY, 2);
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const targetOffsetX = (clientWidth / 2) - centerX * targetZoom;
    // Shift the center slightly up to account for the bottom UI bar
    const targetOffsetY = ((clientHeight - 120) / 2) - centerY * targetZoom;

    const startZoom = zoomStateRef.current;
    const startOffsetX = viewOffsetStateRef.current.x;
    const startOffsetY = viewOffsetStateRef.current.y;
    const duration = 600; // ms
    const startTime = performance.now();

    const animate = (time) => {
        const elapsed = time - startTime;
        if (elapsed < duration) {
            const t = 1 - Math.pow(1 - elapsed / duration, 3); // cubic ease-out
            const newZoom = startZoom + (targetZoom - startZoom) * t;
            const newOffsetX = startOffsetX + (targetOffsetX - startOffsetX) * t;
            const newOffsetY = startOffsetY + (targetOffsetY - startOffsetY) * t;
            
            zoomStateRef.current = newZoom;
            viewOffsetStateRef.current = { x: newOffsetX, y: newOffsetY };
            
            setZoom(newZoom);
            setViewOffset({ x: newOffsetX, y: newOffsetY });
            cameraRef.current = requestAnimationFrame(animate);
        } else {
            zoomStateRef.current = targetZoom;
            viewOffsetStateRef.current = { x: targetOffsetX, y: targetOffsetY };
            setZoom(targetZoom);
            setViewOffset({ x: targetOffsetX, y: targetOffsetY });
        }
    };
    if (cameraRef.current) cancelAnimationFrame(cameraRef.current);
    cameraRef.current = requestAnimationFrame(animate);
  }, []);

  const handleZoomExtents = useCallback(() => {
    animateCameraToNodes(nodesRef.current);
  }, [animateCameraToNodes]);

  useEffect(() => {
    // If we just added the first root node to an empty canvas, gently zoom in
    if (nodes.length === 1 && nodes[0].createdAt && Date.now() - nodes[0].createdAt < 500) {
      animateCameraToNodes(nodes);
    }
  }, [nodes.length, animateCameraToNodes]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let wheelRafId: number | null = null;
    let isScheduled = false;
    let isTrackpadMode = false;
    let trackpadTimeout: any = null;

    const handleWheel = (e: any) => {
      e.preventDefault();
      
      let localZoom = zoomStateRef.current;
      let localOffsetX = viewOffsetStateRef.current.x;
      let localOffsetY = viewOffsetStateRef.current.y;
      
      const isPinch = e.ctrlKey || e.metaKey;
      const hasFraction = e.deltaX % 1 !== 0 || e.deltaY % 1 !== 0;
      const hasX = Math.abs(e.deltaX) > 0;
      const isSmallDelta = Math.abs(e.deltaY) < 50 && Math.abs(e.deltaY) > 0;
      
      if (isPinch || hasFraction || hasX || isSmallDelta) {
          isTrackpadMode = true;
          if (trackpadTimeout) clearTimeout(trackpadTimeout);
          trackpadTimeout = setTimeout(() => { isTrackpadMode = false; }, 400);
      }

      const isMouseWheel = !isTrackpadMode;

      if (isPinch || isMouseWheel) {
        const zoomIntensity = isPinch ? 0.01 : 0.002;
        const zoomFactor = Math.exp(-e.deltaY * zoomIntensity);
        const newZoom = Math.min(Math.max(localZoom * zoomFactor, 0.05), 15);
        
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        localOffsetX = mouseX - (mouseX - localOffsetX) * (newZoom / localZoom);
        localOffsetY = mouseY - (mouseY - localOffsetY) * (newZoom / localZoom);
        localZoom = newZoom;
      } else {
        localOffsetX -= e.deltaX;
        localOffsetY -= e.deltaY;
      }

      zoomStateRef.current = localZoom;
      viewOffsetStateRef.current = { x: localOffsetX, y: localOffsetY };

      if (!isScheduled) {
        isScheduled = true;
        wheelRafId = requestAnimationFrame(() => {
          if (mainGroupRef.current) mainGroupRef.current.setAttribute('transform', `translate(${localOffsetX}, ${localOffsetY}) scale(${localZoom})`);
          if (bgGridRef.current) bgGridRef.current.style.transform = `translate(${localOffsetX}px, ${localOffsetY}px) scale(${localZoom})`;
          isScheduled = false;
        });
      }
      
      if (trackpadTimeout) clearTimeout(trackpadTimeout);
      trackpadTimeout = setTimeout(() => {
          isTrackpadMode = false;
          setZoom(zoomStateRef.current);
          setViewOffset(viewOffsetStateRef.current);
      }, 150);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
        container.removeEventListener('wheel', handleWheel);
        if (wheelRafId) cancelAnimationFrame(wheelRafId);
    };
  }, [currentView]);

  const selectedNodesData = nodes.filter(n => selectedNodeIds.has(n.id));

  const isAdmin = user && (user as any).email === 'efe.alpay@gmail.com';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#020617] text-white font-sans select-none">
      <div className="fixed top-0 inset-x-0 z-[200]"><PaymentTestModeBanner /></div>
      {purchaseSuccess && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0f172a] border border-emerald-500/40 rounded-2xl p-6 text-center shadow-2xl">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-black text-white">You're on {billing.tier === 'pro' ? 'Pro' : billing.tier === 'plus' ? 'Plus' : 'a paid plan'}</h3>
            <p className="text-sm text-slate-400 mt-2">Your higher generation limit and premium features are unlocked.</p>
            <button
              onClick={() => { setPurchaseSuccess(false); setShowUpgradeModal(false); }}
              className="mt-5 w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold rounded-lg text-sm"
            >
              Start creating
            </button>
          </div>
        </div>
      )}
      {currentView === 'home' ? (
        <HomeScreen 
            user={user} 
            mindmaps={mindmaps} 
            subscriptionTier={subscriptionTier} 
            onOpenMap={loadFromCloud} 
            onCreateMap={createNewMap} 
            onRenameMap={renameMindmap} 
            onDeleteMap={deleteMindmap}
            onDuplicateMap={duplicateMindmap}
            onShowSelectAuth={() => setShowAuthModal(true)} 
            onShowSettings={() => setShowSettingsModal(true)}
            onShowUpgrade={() => setShowUpgradeModal(true)}
            onSignOut={() => signOut(auth)}
            onFeedback={() => window.open('https://efealpay.notion.site/c281d325cbba47949dd4de12ad7b5539?pvs=105', '_blank')}
            isAdmin={isAdmin}
            onShowAdmin={() => setShowAdminDashboard(true)}
        />
      ) : (
        <>
          {/* HUD Sidebar */}
          <aside id="hud-sidebar" className={`transition-all duration-500 border-r border-white/10 bg-black/40 backdrop-blur-2xl will-change-transform z-20 flex flex-col pt-24 ${sidebarOpen ? 'w-80' : 'w-0 opacity-0'}`}>
            <div className="p-6 flex-1 overflow-y-auto space-y-8">
              <div className="flex flex-col gap-4">
                
                {/* Quick Actions Toolbar */}
                <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                   <button onClick={() => setShowCheatSheetModal(true)} className="flex-1 py-2 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white" title="Keyboard Shortcuts"><HelpCircle className="w-4 h-4" /></button>
                   <button onClick={() => setShowTutorialModal(true)} className="flex-1 py-2 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white" title="Tutorial"><BookOpen className="w-4 h-4" /></button>
                   <a href="/account" className="flex-1 py-2 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white" title="Account & billing"><Settings className="w-4 h-4" /></a>
                   <div className="w-[1px] bg-white/10 my-1 mx-1" />
                   <div className="flex-[2] py-2 flex items-center justify-center rounded-lg text-[10px] font-bold tracking-widest text-white/40 uppercase">
                      {saveLoading ? 'Saving...' : 'Saved'}
                   </div>
                </div>
              </div>

          {/* Usage Stats Minified */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
             <div className="flex items-center gap-2 mb-2">
                 <div className={`w-2 h-2 rounded-full ${user && !user.isAnonymous ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                 <span className="text-xs font-bold text-white/80">
                   {user && !user.isAnonymous ? (user.displayName || 'User') : 'Guest'}
                 </span>
                 {subscriptionTier === 'plus' && <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30 uppercase font-bold">PLUS</span>}
                 {subscriptionTier === 'pro' && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase font-bold">PRO</span>}
              </div>
            {subscriptionTier === 'free' && (
              <div className="space-y-2 mb-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <span>Weekly Usage</span>
                  <span>{dailyUsage} / {globalConfig.WEEKLY_LIMIT}</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${dailyUsage >= globalConfig.WEEKLY_LIMIT ? 'bg-red-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${Math.min((dailyUsage / globalConfig.WEEKLY_LIMIT) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            )}
            {subscriptionTier === 'free' && (
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full py-2 mt-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Upgrade
                </button>
            )}

            {subscriptionTier !== 'free' && isDebugMode && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                  <span>Tokens Used</span>
                  <span>{tokensUsed.toLocaleString()} / {subscriptionTier === 'pro' ? PRO_TOKEN_LIMIT.toLocaleString() : PLUS_TOKEN_LIMIT.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 bg-emerald-500" 
                    style={{ width: `${Math.min((tokensUsed / (subscriptionTier === 'pro' ? PRO_TOKEN_LIMIT : PLUS_TOKEN_LIMIT)) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Idea Tools Removed */}

          <div className="space-y-5 bg-white/5 p-5 rounded-2xl border border-white/10">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                <span className="flex items-center gap-2"><Sliders className="w-3 h-3" /> Idea Density</span>
                <span className="bg-indigo-500 text-white px-1.5 py-0.5 rounded">{genCount}</span>
              </div>
              <input type="range" min="3" max="12" step="1" value={genCount} onChange={(e) => setGenCount(parseInt(e.target.value))} className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                <span className="flex items-center gap-2"><TypeIcon className="w-3 h-3" /> Node Word Count</span>
                <span className="bg-indigo-500 text-white px-1.5 py-0.5 rounded">{maxWords}</span>
              </div>
              <input type="range" min="1" max="10" step="1" value={maxWords} onChange={(e) => setMaxWords(parseInt(e.target.value))} className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                <span>Field Spacing</span>
                <span className="text-indigo-400">{repulsionStrength}</span>
              </div>
              <input type="range" min="1000" max="6000" step="100" value={repulsionStrength} onChange={(e) => setRepulsionStrength(parseInt(e.target.value))} className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>

          <div className="p-4 bg-emerald-600/10 rounded-2xl border border-emerald-500/20 relative">
            {subscriptionTier !== 'pro' && (
              <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center border border-white/5">
                <div onClick={() => setShowUpgradeModal(true)} className="bg-emerald-900/80 px-3 py-1.5 rounded-lg border border-emerald-500/50 shadow-lg flex items-center gap-2 cursor-pointer hover:bg-emerald-800/80 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Upgrade to PRO</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mb-3"><span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Global Analysis</span></div>
            <button 
              onClick={() => {
                if (!checkUsageLimit()) return;
                performNeuralAnalysis();
              }} 
              disabled={analysisLoading || nodes.length < 2} 
              className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all group disabled:opacity-50" 
              title="Auto-connect related concepts across the map"
            >
              {analysisLoading ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /> : <Layers className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />}
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400/80 group-hover:text-emerald-300">Neural Synthesis</span>
            </button>
          </div>

          <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
            <button 
              onClick={() => { 
                if (!checkUsageLimit()) return;
                setShowSynthesisModal(true); 
                setSynthesizedDoc(null); 
              }} 
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 rounded-xl text-xs font-black tracking-widest uppercase transition-colors text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.4)]" 
              title="Synthesize a cohesive document from the mind map"
            >
              <FilePlus className="w-4 h-4" /> SYNTHESIZE DOC
            </button>
            <button onClick={() => setShowExportModal(true)} className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold hover:bg-white/10 transition-colors text-white/60 hover:text-white flex items-center justify-center gap-2" title="Export mindmap as Markdown, SVG or PNG">
              <Download className="w-3 h-3" /> EXPORT
            </button>
            <button onClick={() => setShowSettingsModal(true)} className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold hover:bg-white/10 transition-colors text-white/60 hover:text-white flex items-center justify-center gap-2" title="Configure models and system settings">
              <Settings className="w-3 h-3" /> SETTINGS
            </button>
          </div>
        </div>
      </aside>
      
      <div className="relative z-30 w-0 h-full flex flex-col justify-center">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute left-0 top-1/2 -translate-y-1/2 bg-indigo-600/90 backdrop-blur-xl will-change-transform border border-indigo-500/50 border-l-0 p-1.5 py-10 rounded-r-2xl shadow-[4px_0_24px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-colors text-white" title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}>
          <ChevronRight className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Persistent Top Left Menu */}
      <div className="absolute top-6 left-6 z-40 flex items-center gap-4 pointer-events-none">
        <div className="flex items-center pointer-events-auto shrink-0">
           <img src="/logo.svg" alt="Mindflov" className={`h-10 transition-opacity duration-700 cursor-pointer ${nodes.length > 2 ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`} />
        </div>
        <div className="flex bg-black/80 backdrop-blur-xl will-change-transform border border-white/10 rounded-xl p-1 gap-1 shadow-2xl pointer-events-auto h-10 items-center px-1">
           <button onClick={() => setCurrentView('home')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-indigo-300 hover:text-indigo-200" title="Home Dashboard"><Home className="w-4 h-4" /></button>
           <div className="w-[1px] h-4 bg-white/10 mx-1" />
           <button onClick={undo} disabled={historyIndex <= 0} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed" title="Undo"><Undo className="w-4 h-4" /></button>
           <button onClick={redo} disabled={historyIndex >= history.length - 1} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed" title="Redo"><Redo className="w-4 h-4" /></button>
           <div className="w-[1px] h-4 bg-white/10 mx-1" />
           <button onClick={() => confirmReset ? resetToInitial() : setConfirmReset(true)} onMouseLeave={() => setConfirmReset(false)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${confirmReset ? 'bg-red-600/20 text-red-500 animate-pulse' : 'text-white/70 hover:text-red-400 hover:bg-white/10'}`} title="Reset System"><RotateCcw className="w-4 h-4" /></button>
        </div>
      </div>

      <main 
        className={`flex-1 relative bg-[#020617] overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`} 
        ref={containerRef}
        onContextMenu={(e) => { 
            e.preventDefault(); 
            const rect = containerRef.current.getBoundingClientRect();
            const worldX = (e.clientX - rect.left - viewOffset.x) / zoom;
            const worldY = (e.clientY - rect.top - viewOffset.y) / zoom;
            setContextMenu({ x: e.clientX, y: e.clientY, type: 'bg', worldX, worldY });
        }}
        onDoubleClick={(e) => {
            if (e.target !== containerRef.current && (e.target as Element).tagName !== 'svg') return;
            const rect = containerRef.current.getBoundingClientRect();
            const worldX = (e.clientX - rect.left - viewOffset.x) / zoom;
            const worldY = (e.clientY - rect.top - viewOffset.y) / zoom;
            const newNode = {
              id: 'node-' + Date.now(),
              label: 'New Node',
              detail: null,
              x: worldX,
              y: worldY,
              fx: worldX, // Pinned to generated position
              fy: worldY,
              vx: 0,
              vy: 0,
              mode: currentMode,
              isRoot: false,
              createdAt: Date.now()
            };
            const newNodes = [...nodes, newNode];
            setNodes(newNodes);
            pushHistory(newNodes, links);
            setEditingNodeId(newNode.id);
            setEditingLabel('New Node');
        }}
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={(e) => {
          handleMouseUp(e);
        }}
        // Wheel listener is handled via useEffect
      >
        {/* Canvas Title Overlay */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          <div className="px-6 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md will-change-transform rounded-2xl border border-white/10 shadow-lg transition-all focus-within:border-white/30">
            <input 
              type="text"
              value={currentMapTitle}
              onChange={(e) => setCurrentMapTitle(e.target.value)}
              onBlur={() => { if (user) saveToCloudRef.current(); }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              className="bg-transparent text-sm font-bold text-white tracking-widest uppercase text-center outline-none min-w-[200px]"
            />
          </div>
        </div>

        {/* Background Scan Grid */}
        <div ref={bgGridRef} className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)`, backgroundSize: '40px 40px', transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoom})`, transformOrigin: '0 0', willChange: 'transform' }} />
        
        {/* Selection Box Overlay */}
        {selectionBox && (
          <div 
            className="absolute border border-indigo-500 bg-indigo-500/20 pointer-events-none z-50"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.currentX),
              top: Math.min(selectionBox.startY, selectionBox.currentY),
              width: Math.abs(selectionBox.currentX - selectionBox.startX),
              height: Math.abs(selectionBox.currentY - selectionBox.startY)
            }}
          />
        )}
        <svg className="w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
          <g ref={mainGroupRef} transform={`translate(${viewOffset.x}, ${viewOffset.y}) scale(${zoom})`}>
            {/* Temp Link */}
            {linkingNodeId && tempLinkEnd && (() => {
                const source = nodes.find(n => n.id === linkingNodeId);
                if (!source) return null;
                return <line x1={source.x} y1={source.y} x2={tempLinkEnd.x} y2={tempLinkEnd.y} stroke="#fff" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />;
            })()}

            {links.map((link, idx) => {
              const source = nodes.find(n => n.id === link.source);
              const target = nodes.find(n => n.id === link.target);
              if (!source || !target) return null;
              const isSynthesis = links.filter(l => l.target === target.id).length > 1;
              const isHighlighted = hoveredNodeId === null || link.source === hoveredNodeId || link.target === hoveredNodeId;
              const isSelected = selectedNodeIds.has(source.id) || selectedNodeIds.has(target.id);
              
              return (
                <LinkComponent 
                  key={`link-${idx}`}
                  link={link}
                  source={source}
                  target={target}
                  isSynthesis={isSynthesis}
                  isHighlighted={isHighlighted}
                  isSelected={isSelected}
                  setLinkRef={(el) => { if(el) linkDOMRefs.current.set(`${link.source}-${link.target}`, el); else linkDOMRefs.current.delete(`${link.source}-${link.target}`); }}
                />
              );
            })}

            {nodes.map((node) => {
              const isSelected = selectedNodeIds.has(node.id);
              const isRelated = hoveredNodeId === null || connectedNodeIds.has(node.id);
              const r = getNodeSize(node.id, node.isRoot);
              const color = getModeColor(node);
              const isNew = (Date.now() - node.createdAt) < 6000;
              const depth = nodeDepths.get(node.id) ?? 0;
              const isGenerating = generatingNodeIds.has(node.id);

              return (
                <NodeComponent 
                  key={node.id}
                  node={node}
                  isSelected={isSelected}
                  isRelated={isRelated}
                  r={r}
                  color={color}
                  isNew={isNew}
                  depth={depth}
                  isGenerating={isGenerating}
                  zoom={zoom}
                  editingNodeId={editingNodeId}
                  onContextMenu={(e, id) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({ x: e.clientX, y: e.clientY, nodeId: id });
                  }}
                  onMouseEnter={(id) => setHoveredNodeId(id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onMouseDown={(e, id) => {
                      e.stopPropagation(); 
                      lastMousePos.current = { x: e.clientX, y: e.clientY };
                      startMousePos.current = { x: e.clientX, y: e.clientY };
                      if (e.shiftKey) {
                          setLinkingNodeId(id);
                          setTempLinkEnd({ x: node.x, y: node.y });
                      } else {
                          if (e.metaKey || e.ctrlKey) {
                              toggleNodeSelection(id);
                          } else {
                              if (!selectedNodeIds.has(id)) {
                                  setSelectedNodeIds(new Set([id]));
                              }
                          }
                          setDraggedNodeId(id); 
                          draggedNodeIdRef.current = id;
                          if (!physicsRef.current) {
                              physicsRef.current = requestAnimationFrame(runSimulation);
                          }
                      }
                  }}
                  onMouseUp={(e, id) => {
                      e.stopPropagation();
                      if (linkingNodeId && linkingNodeId !== id) {
                          setLinks(prev => {
                              if (prev.some(l => (l.source === linkingNodeId && l.target === id) || (l.source === id && l.target === linkingNodeId))) return prev;
                              return [...prev, { source: linkingNodeId, target: id }];
                          });
                      }
                      setLinkingNodeId(null);
                      setTempLinkEnd(null);
                      if (draggedNodeIdRef.current) {
                          setNodes([...physicsNodesRef.current]);
                          pushHistory(physicsNodesRef.current, linksRef.current);
                      }
                      setDraggedNodeId(null);
                      setIsPanning(false);
                  }}
                  onDoubleClick={(e, id) => {
                      e.stopPropagation();
                      setSelectedNodeIds(new Set([id]));
                      addCombinationIdeas();
                  }}
                  onTextDoubleClick={(e, id) => {
                      e.stopPropagation();
                      setEditingNodeId(id);
                      setEditingLabel(node.label);
                  }}
                  setNodeRef={(el) => { if(el) nodeDOMRefs.current.set(node.id, el); else nodeDOMRefs.current.delete(node.id); }}
                />
              );
            })}
          </g>
        </svg>

        {/* HUD Box (Top Right) */}
        <div className="absolute top-6 right-6 flex flex-col gap-2 items-end z-10 pointer-events-none">
          {error && <div className="px-4 py-2 bg-red-900/40 border border-red-500 text-red-300 text-[10px] font-black uppercase tracking-widest backdrop-blur-xl will-change-transform rounded-lg animate-pulse flex items-center gap-2 pointer-events-auto"><AlertCircle className="w-3 h-3" /> {error}</div>}
          
          <div className="flex flex-col md:flex-row items-end md:items-center gap-2 pointer-events-auto">
            {/* View Controls */}
            <div className="flex items-center p-1 bg-black/40 backdrop-blur-xl will-change-transform shadow-2xl rounded-2xl border border-white/10">
              <button onClick={() => { const next = Math.max(zoomStateRef.current * 0.8, 0.1); zoomStateRef.current = next; setZoom(next); }} className="p-2 hover:bg-white/10 rounded-xl transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4 text-indigo-400" /></button>
              <button onClick={() => { const next = Math.min(zoomStateRef.current * 1.2, 8); zoomStateRef.current = next; setZoom(next); }} className="p-2 hover:bg-white/10 rounded-xl transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4 text-indigo-400" /></button>
              <button onClick={handleZoomExtents} className="p-2 hover:bg-white/10 rounded-xl transition-colors" title="Fit to Extents"><Maximize className="w-4 h-4 text-indigo-400" /></button>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-black/40 backdrop-blur-xl will-change-transform border border-white/10 rounded-2xl shadow-2xl flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/40"><div className="w-2 h-2 rounded-full animate-pulse bg-indigo-500" /> Active</div>
              <div className="hidden md:flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/40"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Bridge</div>
              <div className="hidden md:block w-[1px] h-4 bg-white/10" />
              <div className="text-[10px] text-indigo-300 font-bold whitespace-nowrap">Z: {Math.round(zoom * 100)}% | N: {nodes.length}</div>
            </div>
          </div>
        </div>

        {/* Node External Explanation Windows & Action Menu */}
        {(() => {
          if (selectedNodeIds.size === 0) return null;
          
          const selectedNodesData = nodes.filter(n => selectedNodeIds.has(n.id));
          if (selectedNodesData.length === 0) return null;

          const rightmostNode = selectedNodesData.reduce((prev, current) => (prev.x > current.x) ? prev : current);
          const maxY = Math.max(...selectedNodesData.map(n => n.y));
          const minY = Math.min(...selectedNodesData.map(n => n.y));
          const avgY = (minY + maxY) / 2;
          
          const nodeR = getNodeSize(rightmostNode.id, rightmostNode.isRoot);
          
          const selectedNode = selectedNodeIds.size === 1 ? selectedNodesData[0] : null;
          
          const hasDetail = selectedNode && selectedNode.detail;
          const hasInsight = selectedNode && selectedNode.insightData;
          const hasPlan = selectedNode && selectedNode.planData;
          
          return (
            <div className="absolute right-6 top-24 pointer-events-none z-50 flex flex-col items-end gap-3 w-[320px] max-w-full">
               <div className="animate-in slide-in-from-right-8 pointer-events-auto flex flex-col gap-3 w-full" onMouseDown={e => e.stopPropagation()} onMouseMove={e => e.stopPropagation()} onWheel={e => e.stopPropagation()}>
                 {hasDetail && (() => {
                  const modeInfo = MODES[selectedNode.mode] || MODES['general'];
                  return (
                  <div className="bg-black/95 backdrop-blur-2xl will-change-transform border border-white/10 rounded-2xl p-5 shadow-2xl relative shrink-0 flex flex-col max-h-[35vh]">
                    <button onClick={() => { navigator.clipboard.writeText(`${selectedNode.label}\n\n${selectedNode.detail}`); }} className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Copy to clipboard"><Copy className="w-3.5 h-3.5" /></button>
                    <div className="flex items-center gap-2 mb-3 text-[9px] font-black uppercase tracking-widest" style={{ color: modeInfo.color }}>
                      {modeInfo.icon}
                      {modeInfo.label} Node
                    </div>
                    <h3 className="text-sm font-bold text-white mb-3 font-sans pr-8 shrink-0">{selectedNode.label}</h3>
                    <div className="text-xs text-white/80 leading-relaxed font-sans whitespace-pre-wrap select-text custom-scrollbar overflow-y-auto pr-2">
                      <ReactMarkdown components={markdownComponents}>{selectedNode.detail || ''}</ReactMarkdown>
                    </div>
                  </div>
                );
              })()}
              
              {hasInsight && (
                 <div className="bg-black/95 backdrop-blur-2xl will-change-transform border border-indigo-500/40 rounded-2xl p-5 shadow-2xl relative shrink flex flex-col max-h-[30vh]">
                   <div className="absolute top-4 right-4 flex gap-1">
                     <button onClick={() => { navigator.clipboard.writeText(`Deep Insight\n\n${selectedNode.insightData}`); }} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Copy to clipboard"><Copy className="w-3.5 h-3.5" /></button>
                     <button onClick={() => {
                        const newNodes = nodes.map(n => n.id === selectedNode.id ? { ...n, insightData: null } : n);
                        setNodes(newNodes);
                        pushHistory(newNodes, links);
                     }} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Clear Insight"><Trash2 className="w-3.5 h-3.5" /></button>
                   </div>
                   <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3 pr-16 shrink-0">Deep Insight</div>
                   <div className="text-xs text-white/80 leading-relaxed font-sans whitespace-pre-wrap select-text custom-scrollbar overflow-y-auto pr-2">
                     <ReactMarkdown components={markdownComponents}>{selectedNode.insightData || ''}</ReactMarkdown>
                   </div>
                 </div>
              )}

              {hasPlan && (
                 <div className="bg-black/95 backdrop-blur-2xl will-change-transform border border-emerald-500/40 rounded-2xl p-5 shadow-2xl relative shrink flex flex-col max-h-[30vh]">
                   <div className="absolute top-4 right-4 flex gap-1">
                     <button onClick={() => { navigator.clipboard.writeText(`Execution Plan\n\n${selectedNode.planData}`); }} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Copy to clipboard"><Copy className="w-3.5 h-3.5" /></button>
                     <button onClick={() => {
                        const newNodes = nodes.map(n => n.id === selectedNode.id ? { ...n, planData: null } : n);
                        setNodes(newNodes);
                        pushHistory(newNodes, links);
                     }} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Clear Plan"><Trash2 className="w-3.5 h-3.5" /></button>
                   </div>
                   <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3 pr-16 shrink-0">Execution Plan</div>
                   <div className="text-xs text-white/80 leading-relaxed font-sans whitespace-pre-wrap select-text custom-scrollbar overflow-y-auto pr-2">
                     <ReactMarkdown components={markdownComponents}>{selectedNode.planData || ''}</ReactMarkdown>
                   </div>
                 </div>
              )}

              {/* Contextual Action Menu */}
              <div className="bg-black/80 backdrop-blur-3xl will-change-transform border border-indigo-500/40 rounded-2xl p-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col gap-2.5 w-full">
                  
                  {/* Pin Controls */}
                  <div className="flex gap-2">
                     <button 
                       onClick={() => {
                         if (!selectedNode) return;
                         const isPinned = selectedNode.fx !== undefined;
                         const newNodes = nodes.map(n => n.id === selectedNode.id ? { ...n, fx: isPinned ? undefined : n.x, fy: isPinned ? undefined : n.y, vx: 0, vy: 0 } : n);
                         setNodes(newNodes);
                         pushHistory(newNodes, links);
                       }} 
                       className="flex-1 py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px] font-bold text-white/70 uppercase tracking-widest" 
                     >
                       {selectedNode?.fx !== undefined ? 'Unpin Node' : 'Pin Node'}
                     </button>
                     <button 
                       onClick={() => {
                         const newNodes = nodes.map(n => ({ ...n, fx: undefined, fy: undefined, vx: 0, vy: 0 }));
                         setNodes(newNodes);
                         pushHistory(newNodes, links);
                       }} 
                       className="flex-1 py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px] font-bold text-white/70 hover:text-red-400 uppercase tracking-widest" 
                     >
                       Unpin All
                     </button>
                  </div>
                  
                  <div className="w-full h-[1px] bg-white/10" />

                  <div className="flex gap-2">
                     <button 
                       onClick={() => {
                         if (!checkUsageLimit()) return;
                         fetchAnalysis('insight');
                       }} 
                       disabled={analysisLoading} 
                       className="relative flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all group disabled:opacity-50 overflow-hidden" 
                       title="Gain strategic deep insight based on this node"
                     >
                       {analysisLoadingType === 'insight' ? <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" /> : <BookOpen className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />}
                       <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 group-hover:text-white">Insight</span>
                     </button>
                     <button 
                       onClick={() => {
                         if (!checkUsageLimit()) return;
                         fetchAnalysis('plan');
                       }} 
                       disabled={analysisLoading} 
                       className="relative flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all group disabled:opacity-50 overflow-hidden" 
                       title="Generate an actionable step plan for this node"
                     >
                       {analysisLoadingType === 'plan' ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /> : <ListTodo className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />}
                       <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 group-hover:text-white">Action</span>
                     </button>
                  </div>
                
                {loading ? (
                  <button onClick={() => { if (abortControllerRef.current) abortControllerRef.current.abort(); setLoading(false); setGeneratingNodeIds(new Set()); }} className="w-full py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-xl text-xs font-black tracking-tighter shadow-lg flex items-center justify-center gap-2 transition-colors">
                    <X className="w-4 h-4" /> CANCEL GENERATION
                  </button>
                ) : (
                  <>
                  <button 
                    onClick={addCombinationIdeas} 
                    disabled={loading} 
                    className="w-full py-2 rounded-xl text-[12px] font-black tracking-tighter shadow-xl flex items-center justify-center gap-2 text-white hover:brightness-125 transition-all text-shadow-sm" 
                    style={{ backgroundColor: selectedNodeIds.size > 1 ? '#059669' : MODES[currentMode]?.color }}
                    title={selectedNodeIds.size > 1 ? "Synthesize new connections from selection" : `Generate related sub-nodes from this concept using ${MODES[currentMode]?.label}`}
                  >
                    <Layers className="w-4 h-4" />
                    {selectedNodeIds.size > 1 ? 'SYNTHESIZE COMBINATION' : 'EXPAND NODE'}
                  </button>
                  {selectedNodeIds.size > 1 && (
                    <button 
                      onClick={convergeSelectedNodes} 
                      disabled={loading} 
                      className="w-full py-2 rounded-xl text-[12px] font-black tracking-tighter shadow-xl flex items-center justify-center gap-2 text-white hover:brightness-125 transition-all text-shadow-sm" 
                      style={{ backgroundColor: '#6366f1' }}
                      title="Converge selected ideas into a single new concept"
                    >
                      <Combine className="w-4 h-4" />
                      CONVERGE IDEAS
                    </button>
                  )}
                  </>
                )}
                
                <button onClick={() => { if (abortControllerRef.current) abortControllerRef.current.abort(); setSelectedNodeIds(new Set()); }} className="w-full py-1 text-[9px] text-white/30 hover:text-white/60 text-center">Dismiss Selection</button>
              </div>

               </div>
            </div>
          );
        })()}



        {/* Context Menu */}
        {contextMenu && (() => {
          if (contextMenu.type === 'bg') {
            return (
              <div 
                onMouseDown={(e) => e.stopPropagation()}
                className="fixed z-50 bg-black/80 backdrop-blur-xl will-change-transform border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 min-w-32"
                style={{ top: contextMenu.y, left: contextMenu.x }}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const newNode = {
                      id: `node-${Date.now()}`,
                      label: "New Concept",
                      detail: null,
                      x: contextMenu.worldX,
                      y: contextMenu.worldY,
                      vx: 0,
                      vy: 0,
                      mode: 'general',
                      createdAt: Date.now()
                    };
                    const newNodes = [...nodes, newNode];
                    setNodes(newNodes);
                    pushHistory(newNodes, links);
                    setContextMenu(null);
                    setEditingNodeId(newNode.id);
                    setEditingLabel(newNode.label);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm font-semibold text-white transition-colors flex items-center gap-2"
                  title="Create a new concept at this position"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Node Here
                </button>
              </div>
            );
          }

          const node = nodes.find(n => n.id === contextMenu.nodeId);
          if (!node) return null;
          const isPinned = node.fx !== undefined && node.fy !== undefined;
          return (
            <div 
              onMouseDown={(e) => e.stopPropagation()}
              className="fixed z-50 bg-black/80 backdrop-blur-xl will-change-transform border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 min-w-32"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const newNodes = nodes.map(n => n.id === node.id ? { ...n, fx: isPinned ? undefined : n.x, fy: isPinned ? undefined : n.y, vx: 0, vy: 0 } : n);
                  setNodes(newNodes);
                  pushHistory(newNodes, links);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm font-semibold text-white transition-colors flex items-center gap-2"
                title={isPinned ? "Unpin physics" : "Pin in place"}
                >
                <Save className="w-3.5 h-3.5" />
                {isPinned ? 'Unpin Node' : 'Pin to Screen'}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingNodeId(node.id);
                  setEditingLabel(node.label);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm font-semibold text-white transition-colors flex items-center gap-2 border-t border-white/5"
                title="Edit node title"
              >
                <Layers className="w-3.5 h-3.5" />
                Rename Node
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setNodes(prev => prev.filter(n => n.id !== node.id));
                  setLinks(prev => prev.filter(l => l.source !== node.id && l.target !== node.id));
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-sm font-semibold text-red-400 transition-colors flex items-center gap-2 border-t border-white/5"
                title="Delete this node"
              >
                <X className="w-3.5 h-3.5" />
                Delete Node
              </button>
            </div>
          );
        })()}

        {/* HUD Overlay for Editing */}
        {editingNodeId && nodes.find(n => n.id === editingNodeId) && (() => {
          const node = nodes.find(n => n.id === editingNodeId);
          const r = getNodeSize(node.id, node.isRoot);
          const screenX = node.x * zoom + viewOffset.x;
          const screenY = node.y * zoom + viewOffset.y + (r + 24) * zoom;
          return (
          <div
            className="absolute top-0 left-0 pointer-events-none z-50 will-change-transform flex justify-center items-center"
            style={{ transform: `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%)` }}
          >
            <div className="pointer-events-auto">
              <input 
                autoFocus
                onFocus={e => {
                  e.target.select();
                }}
                value={editingLabel}
                onChange={e => setEditingLabel(e.target.value)}
                onMouseDown={e => e.stopPropagation()}
                onKeyDown={e => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    setNodes(prev => prev.map(n => n.id === editingNodeId ? { ...n, label: editingLabel } : n));
                    if (nodes.length === 1 && currentMapTitle === 'Draft Concept' && editingLabel.trim()) {
                      setCurrentMapTitle(editingLabel.trim());
                    }
                    setEditingNodeId(null);
                  } else if (e.key === 'Escape') {
                    setEditingNodeId(null);
                  }
                }}
                onBlur={() => {
                  setNodes(prev => prev.map(n => n.id === editingNodeId ? { ...n, label: editingLabel } : n));
                  if (nodes.length === 1 && currentMapTitle === 'Draft Concept' && editingLabel.trim()) {
                    setCurrentMapTitle(editingLabel.trim());
                  }
                  setEditingNodeId(null);
                }}
                className="bg-[#020617] text-white font-mono uppercase tracking-widest text-center border border-indigo-500 rounded px-2 py-1 outline-none shadow-2xl"
                style={{ fontSize: `${Math.max(10, 10 * zoom)}px`, minWidth: '120px' }}
              />
            </div>
          </div>
        );
        })()}

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <button
              onClick={handleCreateInitialNode}
              className="pointer-events-auto px-6 py-4 bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-sm transition-colors text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20"
            >
              <Plus className="w-5 h-5" /> Click here to add a keyword
            </button>
          </div>
        )}



        {/* Ambient Bottom Line */}
        <div 
          className="absolute bottom-0 inset-x-0 h-[1px] z-50 pointer-events-none transition-all duration-500 opacity-80"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${MODES[currentMode]?.color} 50%, transparent 100%)` }}
        />

        {/* Global Input & Settings Bottom Toolbar */}
        <div 
           className="absolute bottom-0 inset-x-0 z-40 pointer-events-none flex justify-center items-end pb-6 pt-32 transition-all duration-500"
        >
          {/* Fading Line towards sides and top */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full"
            style={{
              height: '40px',
              background: `linear-gradient(to top, ${MODES[currentMode]?.color}80 0%, ${MODES[currentMode]?.color}00 100%)`,
              maskImage: 'linear-gradient(to right, transparent 0%, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 50%, transparent 100%)'
            }}
          />
          <div id="main-input-bar" className="flex flex-col items-center gap-2 pointer-events-auto w-full md:w-auto mx-4 max-w-full transition-all duration-500">
            <div className="text-xs uppercase font-black text-indigo-300 tracking-widest pointer-events-none mb-2 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/30 animate-pulse shadow-lg shadow-indigo-500/20">
              Double-click canvas to add root concept
            </div>
            <div id="mode-selector" className="flex items-center justify-start md:justify-center w-full md:w-auto gap-2 md:gap-3 overflow-x-auto custom-scrollbar pb-1 md:pb-0 shrink" onMouseDown={e => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setTempRole(globalRole);
                    setTempPrimer(globalPrimer);
                    setShowPrimerModal(true);
                  }}
                  title="Change Project Role Context"
                  className="relative px-5 py-3 md:px-5 lg:px-6 shrink-0 rounded-2xl transition-all border-2 flex items-center justify-center gap-3 backdrop-blur-xl shadow-[0_0_30px_rgba(99,102,241,0.3)] bg-gradient-to-br from-indigo-600/30 to-indigo-900/40 border-indigo-500/50 hover:bg-indigo-500/40 hover:border-indigo-400 hover:scale-[1.02] active:scale-95 mr-2"
                >
                  {(() => {
                    const activeRole = PREDEFINED_ROLES.find(r => r.id === globalRole) || PREDEFINED_ROLES[0];
                    return React.cloneElement(activeRole.icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6 drop-shadow-md text-indigo-300' });
                  })()}
                  <div className="flex flex-col items-start hidden lg:flex">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80 leading-none mb-1">Active Role</span>
                    <span className="text-sm font-bold whitespace-nowrap drop-shadow-sm text-indigo-50 leading-none">{
                      (PREDEFINED_ROLES.find(r => r.id === globalRole) || PREDEFINED_ROLES[0]).label
                    }</span>
                  </div>
                </button>
                <div className="w-px h-8 bg-white/10 shrink-0 mx-1 hidden md:block"></div>
                {Object.entries(MODES).map(([key, mode]: [string, any]) => {
                  return (
                    <button 
                      key={key} 
                      onClick={() => {
                        setCurrentMode(key);
                      }} 
                      title={mode.label}
                      style={currentMode === key ? { backgroundColor: `${mode.color}40`, borderColor: mode.color, boxShadow: `0 8px 32px ${mode.color}40`, color: mode.color } : {}}
                      className={`relative px-4 py-3 md:px-3 lg:px-4 shrink-0 rounded-xl transition-all border flex items-center justify-center gap-2.5 backdrop-blur-xl shadow-xl ${currentMode === key ? 'bg-black/40' : 'bg-[#020617]/70 border-white/10 text-white/50 hover:bg-white/10 hover:border-white/20 hover:text-white/90'}`}
                    >
                      {React.cloneElement(mode.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5 drop-shadow-sm' })}
                      <span className={`text-sm font-bold whitespace-nowrap drop-shadow-sm ${currentMode === key ? 'block' : 'hidden lg:block opacity-70 group-hover:opacity-100'}`}>{mode.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </main>
      </>
      )}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        onRequireAuth={() => {
          setShowUpgradeModal(false);
          setShowAuthModal(true);
        }}
        subscriptionTier={billing.tier !== 'free' ? billing.tier : subscriptionTier}
        userId={user?.uid}
        userEmail={user?.email}
        isAnonymous={user?.isAnonymous}
        hasSubscription={billing.status !== 'inactive'}
        onPurchased={() => {
          void billing.refresh();
          setPurchaseSuccess(true);
        }}
        globalConfig={globalConfig}
      />
      <MapModal 
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        mode={mapModalMode}
        mindmaps={mindmaps}
        currentMindmapId={currentMindmapId}
        onLoad={loadFromCloud}
        onSave={saveToCloud}
        onDelete={deleteMindmap}
        onRename={renameMindmap}
        newMapTitle={newMapTitle}
        setNewMapTitle={setNewMapTitle}
      />
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        auth={auth}
      />
      <CheatSheetModal
        isOpen={showCheatSheetModal}
        onClose={() => setShowCheatSheetModal(false)}
      />
      <OnboardingTour
        userId={user?.uid}
        active={currentView === 'canvas'}
        signals={{
          hasSeed: nodes.length > 0,
          hasExpanded: links.length > 0,
          hasSynthesized: Boolean(synthesizedDoc),
          hasExported: hasExportedOnce,
        }}
        onOpenUpgrade={() => setShowUpgradeModal(true)}
      />
      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
      />
      <AdminDashboard
        isOpen={showAdminDashboard}
        onClose={() => setShowAdminDashboard(false)}
      />
      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
        onExportTXT={handleTxtExport} 
        onExportMD={handleMdExport}
        onExportSVG={exportAsSVG} 
        onExportPNG={exportAsPNG} 
        subscriptionTier={subscriptionTier}
        onShowUpgrade={() => setShowUpgradeModal(true)}
      />
      
      {/* Global Primer Modal */}
      {showPrimerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPrimerModal(false)} />
          <div className="bg-[#020617] border border-white/10 rounded-2xl w-full max-w-5xl relative z-10 shadow-2xl animate-in fade-in zoom-in-95 flex flex-col md:flex-row overflow-hidden max-h-[85vh] md:h-[800px]">
            <button onClick={() => setShowPrimerModal(false)} className="absolute top-4 right-4 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors z-20">
              <X className="w-5 h-5" />
            </button>
            
            {/* Left Column: Context List */}
            <div className="flex-1 p-6 md:border-r border-white/10 flex flex-col overflow-hidden min-h-0">
              <div className="mb-6 shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <Compass className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-black text-white uppercase tracking-widest">Global Project Context</h2>
                </div>
                <p className="text-xs text-white/50 leading-relaxed mb-4">
                  Select a context. Hover over any option to preview how its generation modes behave.
                </p>
                <div className="flex border-b border-white/10">
                  <button 
                    onClick={() => setActivePrimerTab('all')}
                    className={`flex-1 pb-2 text-xs font-bold tracking-widest uppercase transition-colors ${activePrimerTab === 'all' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/40 hover:text-white/70'}`}
                  >
                    All Contexts
                  </button>
                  <button 
                    onClick={() => setActivePrimerTab('favorites')}
                    className={`flex-1 pb-2 text-xs font-bold tracking-widest uppercase transition-colors ${activePrimerTab === 'favorites' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/40 hover:text-white/70'}`}
                  >
                    Favorites
                  </button>
                </div>
              </div>
              
              <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-2 min-h-0" onMouseLeave={() => setHoveredRole(null)}>
                {ROLE_CATEGORIES.map(cat => {
                  const visibleRoles = activePrimerTab === 'favorites' ? cat.roles.filter(id => favoriteRoles.includes(id)) : cat.roles;
                  if (visibleRoles.length === 0) return null;
                  return (
                  <div key={cat.category} className="space-y-2">
                    <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-2 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-white/20"></div>
                      {cat.category}
                    </h4>
                    <ul className="space-y-1 ml-4 list-disc marker:text-white/30 pl-2">
                      {visibleRoles.map(roleId => {
                        const role = PREDEFINED_ROLES.find(r => r.id === roleId);
                        if (!role) return null;
                        return (
                          <li key={role.id} className="group">
                            <div className="flex items-center gap-1 w-full">
                              <button
                                onClick={() => {
                                  setTempRole(role.id);
                                  if (role.id !== 'custom') {
                                    setTempPrimer(role.prompt);
                                  } else {
                                    setTempPrimer(localStorage.getItem('mindflow_custom_primer') || '');
                                  }
                                }}
                                onMouseEnter={() => setHoveredRole(role.id)}
                                className={`flex-1 flex items-center gap-3 p-2 rounded-lg border transition-all text-left ${tempRole === role.id ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white'}`}
                              >
                                <div className="shrink-0 opacity-70">{React.cloneElement(role.icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' })}</div>
                                <span className="text-xs font-medium tracking-wide">{role.label}</span>
                              </button>
                              {role.id !== 'custom' && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFavoriteRoles(prev => {
                                      const next = prev.includes(role.id) ? prev.filter(id => id !== role.id) : [...prev, role.id];
                                      localStorage.setItem('mindflow_favorite_roles', JSON.stringify(next));
                                      return next;
                                    });
                                  }}
                                  className={`p-2 rounded-lg transition-colors hover:bg-white/10 ${favoriteRoles.includes(role.id) ? 'text-yellow-400 opacity-100' : 'text-white/20 hover:text-white/50 opacity-0 group-hover:opacity-100'}`}
                                >
                                  <Star className={`w-4 h-4 ${favoriteRoles.includes(role.id) ? 'fill-current' : ''}`} />
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )})}
              </div>
              
              {tempRole === 'custom' && (
                <div className="pt-4 animate-in fade-in slide-in-from-top-2 border-t border-white/10 mt-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Custom Context / Prompt</label>
                  <textarea 
                    value={tempPrimer}
                    onChange={e => {
                      setTempPrimer(e.target.value);
                      localStorage.setItem('mindflow_custom_primer', e.target.value);
                    }}
                    placeholder="e.g., We are building a cyberpunk sci-fi world set in 2099 where corporations rule..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none h-32"
                  />
                </div>
              )}
              
              <div className="flex gap-3 pt-4 mt-4 border-t border-white/5">
                <button 
                  onClick={() => setShowPrimerModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setGlobalRole(tempRole);
                    setCurrentMode('general');
                    if (tempRole !== 'custom') {
                       const roleObj = PREDEFINED_ROLES.find(r => r.id === tempRole);
                       setGlobalPrimer(roleObj?.prompt || '');
                    } else {
                       setGlobalPrimer(tempPrimer);
                    }
                    setShowPrimerModal(false);
                  }}
                  className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black text-white uppercase tracking-widest transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Apply Context
                </button>
              </div>
            </div>
            
            {/* Right Column: Explanations */}
            <div className="w-96 bg-[#04081c] p-6 flex flex-col border-l border-white/5 overflow-hidden min-h-0">
              {(() => {
                const activeId = hoveredRole || tempRole;
                if (!activeId) return null;
                const roleObj = PREDEFINED_ROLES.find(r => r.id === activeId);
                if (!roleObj) return null;
                
                if (roleObj.id === 'custom') {
                  return (
                    <div className="flex-1 flex flex-col justify-center items-center text-center p-6 opacity-60">
                      <Settings className="w-12 h-12 mb-4 text-slate-400" />
                      <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Custom Context</h3>
                      <p className="text-xs text-white/70 leading-relaxed">Create your own specific scenario. The 4 generation modes will interpret your custom prompt accordingly.</p>
                    </div>
                  );
                }
                
                const modes = getModesForRole(roleObj.id);
                return (
                  <div className="flex-1 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                    <div className="flex items-center gap-3 mb-4 shrink-0">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                        {React.cloneElement(roleObj.icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6 text-white' })}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">{roleObj.label}</h3>
                      </div>
                    </div>
                    
                    <p className="text-xs text-white/70 leading-relaxed mb-6 pb-4 border-b border-white/10">
                      {roleObj.prompt}
                    </p>

                    <h4 className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-3">Mode Behaviors</h4>
                    
                    <div className="space-y-4">
                      {Object.entries(modes).map(([modeKey, modeVal]: [string, any]) => (
                        <div key={modeKey} className="bg-[#020617] rounded-xl p-4 border border-white/5 shadow-md">
                          <div className="flex items-center gap-2 mb-2">
                            {React.cloneElement(modeVal.icon as React.ReactElement<{ className?: string, style?: React.CSSProperties }>, { className: 'w-4 h-4', style: { color: modeVal.color } })}
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: modeVal.color }}>{modeVal.label}</span>
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed">
                            {modeVal.prompt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Synthesis Modal */}
      {(showSynthesisModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSynthesisModal(false)} />
          <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 w-full max-w-3xl max-h-[85vh] flex flex-col relative z-10 shadow-2xl animate-in fade-in zoom-in-95">
             <button onClick={() => setShowSynthesisModal(false)} className="absolute top-4 right-4 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors">
               <X className="w-5 h-5" />
             </button>
             <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <FilePlus className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Synthesize Document</h2>
                  <p className="text-xs text-white/50">A coherent narrative generated from your mind map strategy.</p>
                </div>
             </div>
             
             {(!synthesizedDoc && !synthesisLoading) ? (
               <div className="flex-1 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-widest">Project Context & Goals (Optional)</label>
                    <textarea 
                       value={synthesisContext}
                       onChange={e => setSynthesisContext(e.target.value)}
                       placeholder="Explain what this document is for, your target audience, or any specific goals..."
                       className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none h-32"
                    />
                  </div>
                  <button 
                     onClick={generateSynthesizedDocument}
                     className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-black tracking-widest uppercase text-white transition-colors flex items-center justify-center gap-2 mt-auto"
                  >
                     <Zap className="w-5 h-5" /> Generate Document
                  </button>
               </div>
             ) : (
               <>
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-white/5 border border-white/5 rounded-xl mb-6 relative">
                   {synthesisLoading ? (
                     <div className="flex flex-col items-center justify-center h-full gap-4 text-indigo-400/80">
                       <Loader2 className="w-8 h-8 animate-spin" />
                       <p className="text-xs uppercase tracking-widest font-bold">Synthesizing strategy...</p>
                     </div>
                   ) : (
                     <div className="text-sm text-white/80 font-sans leading-relaxed prose prose-invert max-w-none">
                       <ReactMarkdown components={markdownComponents}>{synthesizedDoc || ''}</ReactMarkdown>
                     </div>
                   )}
                 </div>
                 
                 {/* Hidden PDF Container */}
                 {synthesizedDoc && (
                   <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                     <div id="hidden-pdf-content" className="bg-white text-black w-[720px] font-sans" style={{ boxSizing: 'border-box' }}>
                        <div style={{ backgroundColor: '#020617', padding: '32px', borderBottom: '4px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                             <img src="/logo.svg" alt="Mindflov" style={{ width: '154px', height: '40px', objectFit: 'contain' }} crossOrigin="anonymous" />
                             <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.3)', borderRadius: '4px', padding: '2px 6px', marginTop: '4px' }}>BETA</span>
                           </div>
                           <div style={{ textAlign: 'right' }}>
                             <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.025em' }}>Strategic Synthesis</h1>
                             <p style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace', margin: '4px 0 0 0' }}>{new Date().toLocaleDateString()}</p>
                           </div>
                        </div>
                        <div style={{ padding: '0 8px 16px 8px' }}>
                           <div className="text-black">
                              <ReactMarkdown components={pdfMarkdownComponents}>{synthesizedDoc}</ReactMarkdown>
                           </div>
                           <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '10px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                              Generated by Mindflov AI
                           </div>
                        </div>
                     </div>
                   </div>
                 )}

                 {!synthesisLoading && synthesizedDoc && (
                   <div className="flex gap-3 shrink-0">
                      <button 
                        onClick={() => { setSynthesizedDoc(null); setSynthesisContext(""); }}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white transition-colors"
                        title="Start Over"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => navigator.clipboard.writeText(synthesizedDoc)}
                        className="flex-1 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-bold text-xs text-white uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                      >
                        <Copy className="w-4 h-4" /> Copy to Clipboard
                      </button>
                      <button 
                        onClick={() => {
                          const file = new Blob([synthesizedDoc], {type: 'text/markdown'});
                          const link = document.createElement("a");
                          link.href = URL.createObjectURL(file);
                          link.download = "mindflow-synthesized-doc.md";
                          link.click();
                          setTimeout(() => URL.revokeObjectURL(link.href), 100);
                        }}
                        className="flex-1 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-bold text-xs text-white uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4" /> Markdown
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            const html2pdfModule = await import('html2pdf.js');
                            const html2pdf = html2pdfModule.default || html2pdfModule;
                            const element = document.getElementById('hidden-pdf-content');
                            if (!element) return;
                            
                            // Temporarily display the element so html2canvas can render it properly
                            const originalTop = element.parentElement!.style.top;
                            const originalLeft = element.parentElement!.style.left;
                            const originalPosition = element.parentElement!.style.position;
                            const originalZIndex = element.parentElement!.style.zIndex;
                            const originalOpacity = element.parentElement!.style.opacity;
                            
                            element.parentElement!.style.position = 'fixed';
                            element.parentElement!.style.top = '0';
                            element.parentElement!.style.left = '0';
                            element.parentElement!.style.zIndex = '-9999';
                            element.parentElement!.style.opacity = '1';

                            const opt = {
                              margin:       0.5,
                              filename:     'mindflow-synthesized-doc.pdf',
                              image:        { type: 'jpeg', quality: 0.98 },
                              html2canvas:  { scale: 2, useCORS: true, windowWidth: 720 },
                              jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
                              pagebreak:    { mode: ['css', 'legacy'] }
                            };
                            
                            await html2pdf().set(opt).from(element).save();
                            
                            // Restore
                            element.parentElement!.style.position = originalPosition;
                            element.parentElement!.style.top = originalTop;
                            element.parentElement!.style.left = originalLeft;
                            element.parentElement!.style.zIndex = originalZIndex;
                            element.parentElement!.style.opacity = originalOpacity;
                            
                          } catch(err) {
                            console.error("PDF generation failed:", err);
                          }
                        }}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 rounded-xl font-bold text-xs text-white uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                      >
                        <Download className="w-4 h-4" /> Download PDF
                      </button>
                   </div>
                 )}
               </>
             )}
          </div>
        </div>
      )}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        modelSettings={modelSettings}
        setModelSettings={setModelSettings}
        includeParentContext={includeParentContext}
        setIncludeParentContext={setIncludeParentContext}
        subscriptionTier={subscriptionTier}
        setSubscriptionTier={setSubscriptionTier}
        auth={auth}
        user={user}
        isDebugMode={isDebugMode}
        setIsDebugMode={setIsDebugMode}
        globalConfig={globalConfig}
      />
    </div>
  );
};

export default App;
