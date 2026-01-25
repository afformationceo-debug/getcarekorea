'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import Image from 'next/image';
import {
  Sparkles,
  Shield,
  Award,
  Users,
  Heart,
  Globe,
  HeartPulse,
  Building2,
  Languages,
  CheckCircle2,
  Star,
  ArrowRight,
  Play,
  Quote,
  Target,
  Lightbulb,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Locale } from '@/lib/i18n/config';

const stats = [
  { icon: Users, value: '50,000+', label: 'Happy Patients' },
  { icon: Building2, value: '200+', label: 'Partner Hospitals' },
  { icon: Languages, value: '7', label: 'Languages' },
  { icon: Globe, value: '50+', label: 'Countries Served' },
];

const values = [
  {
    icon: Shield,
    title: 'Trust & Safety',
    description: 'We only partner with JCI-accredited hospitals and verified medical professionals.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Heart,
    title: 'Patient-First',
    description: 'Your health and comfort are our top priorities throughout your medical journey.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'We connect you with Korea\'s top medical professionals and cutting-edge facilities.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Globe,
    title: 'Accessibility',
    description: 'Breaking language barriers with multi-lingual support in 7 languages.',
    color: 'from-violet-500 to-purple-500',
  },
];

const team = [
  {
    name: 'Dr. Sarah Kim',
    role: 'Medical Director',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
    bio: 'Former Chief of International Medicine at Samsung Medical Center',
  },
  {
    name: 'James Chen',
    role: 'CEO & Founder',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    bio: '15+ years in healthcare technology and medical tourism',
  },
  {
    name: 'Dr. Min-Jun Park',
    role: 'Chief Medical Advisor',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
    bio: 'Board-certified plastic surgeon with 20+ years experience',
  },
  {
    name: 'Emily Wang',
    role: 'Head of Patient Experience',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    bio: 'Dedicated to ensuring seamless medical tourism experiences',
  },
];

const milestones = [
  { year: '2018', title: 'Company Founded', description: 'Started with a mission to make Korean healthcare accessible globally' },
  { year: '2019', title: 'First 1,000 Patients', description: 'Reached our first major milestone in patient care' },
  { year: '2020', title: 'AI Integration', description: 'Launched AI-powered consultation and matching system' },
  { year: '2021', title: '100+ Hospital Partners', description: 'Expanded network to over 100 partner hospitals' },
  { year: '2022', title: 'Multi-language Support', description: 'Added support for 7 languages' },
  { year: '2023', title: '50,000+ Patients', description: 'Helped over 50,000 international patients' },
  { year: '2024', title: 'AI-Powered Platform', description: 'Next-generation platform with advanced AI features' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export default function AboutPage() {
  const t = useTranslations('about');
  const locale = useLocale() as Locale;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-violet-950 via-purple-900 to-background py-20 lg:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/20 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-cyan-500/25 to-blue-600/20 blur-3xl"
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </motion.div>
              <span className="text-sm font-medium text-white/90">Our Story</span>
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white lg:text-6xl">
              <span className="block">Transforming</span>
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Medical Tourism
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70 lg:text-xl">
              We're on a mission to make world-class Korean healthcare accessible to everyone, everywhere.
            </p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ y: -5, rotateY: 5, rotateX: -5 }}
                  style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/10"
                >
                  <stat.icon className="mx-auto mb-2 h-6 w-6 text-cyan-400" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Mission & Vision */}
      <div className="container py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full overflow-hidden border-0 shadow-xl bg-gradient-to-br from-violet-500/5 to-purple-500/10">
                <CardContent className="p-8">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="mb-4 text-2xl font-bold">Our Mission</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    To democratize access to Korea's world-class healthcare by providing seamless,
                    transparent, and personalized medical tourism experiences. We believe everyone
                    deserves access to the best medical care, regardless of where they live.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full overflow-hidden border-0 shadow-xl bg-gradient-to-br from-cyan-500/5 to-blue-500/10">
                <CardContent className="p-8">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                    <Lightbulb className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="mb-4 text-2xl font-bold">Our Vision</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    To become the world's most trusted platform for medical tourism, powered by
                    AI technology that understands and anticipates patient needs. We envision a
                    future where seeking medical care abroad is as simple and stress-free as
                    booking a vacation.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-muted/30 py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <Badge className="mb-4 bg-violet-500">Our Values</Badge>
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">What Drives Us</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Our core values guide everything we do, from patient care to partner relationships.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {values.map((value) => (
              <motion.div key={value.title} variants={itemVariants}>
                <Card className="h-full overflow-hidden border-0 shadow-lg transition-all hover:shadow-xl">
                  <CardContent className="p-6 text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${value.color}`}
                    >
                      <value.icon className="h-8 w-8 text-white" />
                    </motion.div>
                    <h3 className="mb-2 text-lg font-bold">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Timeline */}
      <div className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <Badge className="mb-4 bg-violet-500">Our Journey</Badge>
          <h2 className="mb-4 text-3xl font-bold lg:text-4xl">Milestones</h2>
        </motion.div>

        <div className="relative mx-auto max-w-4xl">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-violet-500 to-purple-500" />

          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.year}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`relative mb-8 flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8'}`}>
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardContent className="p-4">
                    <Badge className="mb-2 bg-gradient-to-r from-violet-500 to-purple-500">
                      {milestone.year}
                    </Badge>
                    <h3 className="mb-1 font-bold">{milestone.title}</h3>
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2">
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-purple-500 ring-4 ring-background"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="bg-muted/30 py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <Badge className="mb-4 bg-violet-500">Our Team</Badge>
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">Meet the Leadership</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              A dedicated team of healthcare professionals and technology experts working to transform medical tourism.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {team.map((member) => (
              <motion.div key={member.name} variants={itemVariants}>
                <Card className="overflow-hidden border-0 shadow-lg transition-all hover:shadow-xl">
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="font-bold">{member.name}</h3>
                      <p className="text-sm text-white/80">{member.role}</p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{member.bio}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* CTA */}
      <div className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-950/50 via-purple-900/50 to-violet-950/50 p-8 lg:p-16">
            <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative z-10 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600"
              >
                <Rocket className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
                Ready to Start Your Journey?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-white/70">
                Join thousands of international patients who have trusted GetCareKorea for their medical tourism needs.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
                  asChild
                >
                  <Link href={`/${locale}/inquiry`}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get Free Consultation
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  asChild
                >
                  <Link href={`/${locale}/hospitals`}>
                    Explore Hospitals
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
