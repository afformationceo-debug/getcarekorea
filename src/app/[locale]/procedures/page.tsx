'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  DollarSign,
  TrendingUp,
  Heart,
  Eye,
  Smile,
  Scissors,
  Activity,
  Baby,
  Stethoscope,
  Brain,
  Bone,
  Pill,
  Shield,
  Star,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Locale } from '@/lib/i18n/config';

const procedures = [
  {
    id: 'plastic-surgery',
    name: 'Plastic Surgery',
    description: 'Transform your appearance with world-renowned Korean plastic surgery techniques.',
    icon: Scissors,
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800',
    procedures: ['Rhinoplasty', 'Blepharoplasty', 'Facelift', 'Breast Augmentation'],
    priceRange: '$2,000 - $15,000',
    recovery: '1-4 weeks',
    popularity: 98,
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    description: 'Advanced skin treatments and rejuvenation procedures.',
    icon: Smile,
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
    procedures: ['Laser Treatments', 'Botox', 'Fillers', 'Skin Rejuvenation'],
    priceRange: '$200 - $5,000',
    recovery: '0-7 days',
    popularity: 92,
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'dental',
    name: 'Dental Care',
    description: 'Comprehensive dental services from implants to cosmetic dentistry.',
    icon: Smile,
    image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800',
    procedures: ['Dental Implants', 'Veneers', 'Teeth Whitening', 'Orthodontics'],
    priceRange: '$500 - $8,000',
    recovery: '1-14 days',
    popularity: 88,
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'ophthalmology',
    name: 'Eye Care',
    description: 'Vision correction and eye health treatments.',
    icon: Eye,
    image: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800',
    procedures: ['LASIK', 'SMILE', 'Cataract Surgery', 'Glaucoma Treatment'],
    priceRange: '$1,500 - $6,000',
    recovery: '1-3 days',
    popularity: 85,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'hair-transplant',
    name: 'Hair Transplant',
    description: 'Natural-looking hair restoration using advanced techniques.',
    icon: Heart,
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800',
    procedures: ['FUE', 'FUT', 'Eyebrow Transplant', 'Beard Transplant'],
    priceRange: '$3,000 - $10,000',
    recovery: '7-14 days',
    popularity: 82,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'health-checkup',
    name: 'Health Checkup',
    description: 'Comprehensive health screening and preventive care.',
    icon: Activity,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
    procedures: ['Full Body Checkup', 'Cancer Screening', 'Cardiac Checkup', 'Executive Package'],
    priceRange: '$500 - $3,000',
    recovery: 'Same day',
    popularity: 90,
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 'fertility',
    name: 'Fertility',
    description: 'Advanced fertility treatments and IVF procedures.',
    icon: Baby,
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800',
    procedures: ['IVF', 'IUI', 'Egg Freezing', 'Fertility Assessment'],
    priceRange: '$5,000 - $20,000',
    recovery: 'Varies',
    popularity: 78,
    color: 'from-pink-400 to-purple-500',
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    description: 'Joint replacement and musculoskeletal treatments.',
    icon: Bone,
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800',
    procedures: ['Knee Replacement', 'Hip Replacement', 'Spine Surgery', 'Sports Medicine'],
    priceRange: '$8,000 - $25,000',
    recovery: '4-12 weeks',
    popularity: 75,
    color: 'from-slate-500 to-gray-600',
  },
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

export default function ProceduresPage() {
  const t = useTranslations('procedures');
  const locale = useLocale() as Locale;
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredProcedures = procedures.filter(
    (proc) =>
      proc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proc.procedures.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Immersive Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-violet-950 via-purple-900 to-background py-20 lg:py-28">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-pink-500/30 to-rose-600/20 blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-cyan-500/25 to-blue-600/20 blur-3xl"
          />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl text-center"
          >
            {/* AI Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </motion.div>
              <span className="text-sm font-medium text-white/90">
                AI-Matched Procedures
              </span>
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white lg:text-6xl">
              <span className="block">Medical</span>
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Procedures
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70 lg:text-xl">
              Explore world-class medical procedures available in Korea at competitive prices with exceptional quality.
            </p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4"
            >
              {[
                { icon: Stethoscope, value: '50+', label: 'Procedures' },
                { icon: Shield, value: '100%', label: 'JCI Certified' },
                { icon: TrendingUp, value: '40%', label: 'Cost Savings' },
                { icon: Star, value: '4.9', label: 'Avg Rating' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ y: -5, rotateY: 5, rotateX: -5 }}
                  style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/10"
                >
                  <stat.icon className="mx-auto mb-2 h-6 w-6 text-cyan-400 transition-transform group-hover:scale-110" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container py-8">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="-mt-16 relative z-20 mb-12"
        >
          <div className="glass mx-auto max-w-2xl rounded-2xl p-4 shadow-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search procedures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 rounded-xl border-0 bg-background/50 pl-12 text-base shadow-inner focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>
        </motion.div>

        {/* Procedures Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredProcedures.map((procedure) => (
            <motion.div
              key={procedure.id}
              variants={itemVariants}
              onHoverStart={() => setHoveredId(procedure.id)}
              onHoverEnd={() => setHoveredId(null)}
            >
              <Link href={`/${locale}/procedures/${procedure.id}`}>
                <motion.div
                  whileHover={{
                    y: -12,
                    rotateY: 3,
                    rotateX: -3,
                  }}
                  style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                  className="group h-full overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg transition-all duration-500 hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/10"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={procedure.image}
                      alt={procedure.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 1 }}
                      animate={{ scale: hoveredId === procedure.id ? 1.1 : 1 }}
                      className={`absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${procedure.color} shadow-lg`}
                    >
                      <procedure.icon className="h-6 w-6 text-white" />
                    </motion.div>

                    {/* Popularity Badge */}
                    <Badge className="absolute left-4 top-4 bg-black/50 backdrop-blur-sm">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      {procedure.popularity}% Popular
                    </Badge>

                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-xl font-bold text-white">{procedure.name}</h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                      {procedure.description}
                    </p>

                    {/* Procedures List */}
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {procedure.procedures.slice(0, 3).map((proc) => (
                        <Badge key={proc} variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                          {proc}
                        </Badge>
                      ))}
                      {procedure.procedures.length > 3 && (
                        <Badge variant="secondary">+{procedure.procedures.length - 3}</Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span>{procedure.priceRange}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>{procedure.recovery}</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: hoveredId === procedure.id ? 1 : 0, y: hoveredId === procedure.id ? 0 : 10 }}
                      className="mt-4 flex items-center justify-center gap-2 text-primary"
                    >
                      <span className="font-medium">Explore Procedure</span>
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* AI CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-950/50 via-purple-900/50 to-violet-950/50 p-8 lg:p-12">
            <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600"
              >
                <Zap className="h-10 w-10 text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="mb-2 text-2xl font-bold text-white lg:text-3xl">
                  Not sure which procedure is right for you?
                </h3>
                <p className="text-white/70">
                  Our AI assistant can help analyze your needs and recommend the best procedures based on your goals and medical history.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Get AI Consultation
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
