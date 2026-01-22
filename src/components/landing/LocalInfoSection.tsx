'use client';

import { motion } from 'framer-motion';
import { Utensils, Hotel, Car, Map, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const categories = [
  {
    id: 'restaurants',
    icon: Utensils,
    title: 'Recovery-Friendly Restaurants',
    description: 'Curated list of soft food restaurants near top clinics',
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&h=600&fit=crop',
    color: 'from-orange-500 to-red-500',
    items: ['Porridge Cafes', 'Soup Restaurants', 'Juice Bars', 'Healthy Cafes'],
  },
  {
    id: 'accommodation',
    icon: Hotel,
    title: 'Nearby Accommodations',
    description: 'Comfortable stays designed for post-procedure recovery',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    color: 'from-blue-500 to-purple-500',
    items: ['Recovery Hotels', 'Service Apartments', 'Medical Guesthouses', 'Premium Suites'],
  },
  {
    id: 'transportation',
    icon: Car,
    title: 'Airport Pickup & Transfer',
    description: 'Seamless transportation from arrival to departure',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=600&fit=crop',
    color: 'from-green-500 to-teal-500',
    items: ['Airport Pickup', 'Hospital Transfers', 'City Tours', 'Return Transport'],
  },
];

export function LocalInfoSection() {
  return (
    <section className="relative py-20 lg:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-l from-primary/5 to-transparent blur-3xl" />
      </div>

      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center lg:mb-16"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Map className="h-4 w-4" />
            Complete Support
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-5xl">
            Everything You Need in Korea
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            From the moment you land to your safe return home, we&apos;ve got you covered
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                whileHover={{ y: -8 }}
                className="group h-full overflow-hidden rounded-2xl border bg-background shadow-lg"
              >
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Icon overlay */}
                  <div className="absolute bottom-4 left-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} shadow-lg`}
                    >
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="mb-2 text-xl font-bold transition-colors group-hover:text-primary">
                    {category.title}
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">{category.description}</p>

                  {/* Items */}
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    {category.items.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <ChevronRight className="h-3 w-3 text-primary" />
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button variant="outline" className="w-full gap-2 rounded-full" asChild>
                    <Link href={`/services/${category.id}`}>
                      Learn More
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-blue-500/10 p-8 text-center lg:p-12"
        >
          <h3 className="mb-3 text-2xl font-bold lg:text-3xl">
            All Services Included in Your Package
          </h3>
          <p className="mb-6 text-muted-foreground">
            Book through GetCareKorea and get complimentary airport pickup, accommodation
            recommendations, and local dining guides
          </p>
          <Button size="lg" className="gap-2 rounded-full px-8" asChild>
            <Link href="/inquiry">
              Get Your Free Package Quote
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
