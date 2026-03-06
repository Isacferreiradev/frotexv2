'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Check,
  Zap,
  ArrowRight,
  Play,
  Globe,
  BarChart3,
  ShieldCheck,
  Users2,
  LayoutDashboard,
  Smartphone,
  History,
  Box,
  Sparkles,
  Shield,
  Clock,
  PieChart,
  Settings,
  Users,
  Gem
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Essential',
    price: 'R$ 0',
    description: 'Perfeito para validação e pequenas operações.',
    features: [
      'Até 10 equipamentos',
      '1 usuário administrativo',
      'Gestão de estoque básica',
      'Contratos em PDF',
      'Relatórios mensais'
    ],
    cta: 'Começar Agora',
    variant: 'outline',
  },
  {
    name: 'Professional',
    price: 'R$ 97',
    period: '/mês',
    description: 'O motor de crescimento para sua locadora.',
    features: [
      'Equipamentos ILIMITADOS',
      'Até 3 usuários simultâneos',
      'Inteligência de ROI & Lucro',
      'Auto-faturamento Pix/Boleto',
      'Suporte via Chat Prioritário'
    ],
    cta: 'Assinar Pro',
    variant: 'primary',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'R$ 197',
    period: '/mês',
    description: 'Potência máxima e controle total multi-unidade.',
    features: [
      'Tudo do plano Professional',
      'Usuários ILIMITADOS',
      'Gestão de Múltiplas Filiais',
      'API de Integração',
      'Account Manager Exclusivo'
    ],
    cta: 'Falar com Consultor',
    variant: 'dark',
  }
];

const features = [
  {
    title: "Cockpit Inteligente",
    desc: "Uma visão 360º em tempo real de toda a sua operação, do estoque ao fluxo de caixa.",
    icon: LayoutDashboard,
    color: "bg-blue-500",
    span: "col-span-2 row-span-2"
  },
  {
    title: "Gestão de Clientes",
    desc: "CRM completo para gerir sua base de clientes, contatos e histórico.",
    icon: Users2,
    color: "bg-amber-400",
    span: "col-span-1"
  },
  {
    title: "Mobile First",
    desc: "Acesse e gerencie de qualquer lugar, em qualquer dispositivo.",
    icon: Smartphone,
    color: "bg-emerald-500",
    span: "col-span-1"
  },
  {
    title: "Inteligência de Dados",
    desc: "Saiba exatamente qual equipamento te dá mais lucro com nossa análise de ROI.",
    icon: BarChart3,
    color: "bg-purple-600",
    span: "col-span-1"
  },
  {
    title: "Histórico Imutável",
    desc: "Rastreabilidade completa de cada ferramenta e locação.",
    icon: History,
    color: "bg-indigo-500",
    span: "col-span-1"
  }
];

export default function HomePage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-violet-100">
      {/* Header / Nav */}
      <header className="fixed top-0 w-full z-[100] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link href="/">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white font-extrabold shadow-lg group-hover:bg-violet-600 transition-colors">L</div>
                <span className="text-2xl font-extrabold italic tracking-tight">Locattus<span className="text-violet-600 not-italic">.</span></span>
              </div>
            </Link>
          </motion.div>

          <div className="hidden lg:flex items-center gap-10 py-2 px-8 bg-white/50 backdrop-blur-xl border border-white/50 rounded-full shadow-sm">
            <a href="#features" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-violet-600 transition-colors">Recursos</a>
            <a href="#pricing" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-violet-600 transition-colors">Planos</a>
            <a href="#workflow" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-violet-600 transition-colors">Como Funciona</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-violet-600">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-slate-950 hover:bg-violet-700 text-white rounded-2xl px-8 h-12 text-xs font-bold uppercase tracking-widest shadow-xl shadow-slate-100 transition-all hover:scale-105 active:scale-95">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-48 pb-20 px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center">
          {/* Background Floating Decorative Elements (Model Style) */}
          <div className="absolute inset-0 pointer-events-none -z-10">
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/4 w-32 h-32 bg-violet-100/20 backdrop-blur-3xl rounded-3xl border border-violet-100/50 -rotate-12 flex items-center justify-center"
            >
              <Box className="w-8 h-8 text-violet-600/30" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-indigo-100/10 backdrop-blur-3xl rounded-[2.5rem] border border-indigo-100/30 rotate-12 flex items-center justify-center"
            >
              <PieChart className="w-10 h-10 text-indigo-600/20" />
            </motion.div>
          </div>

          <div className="max-w-7xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ opacity, scale }}
            >
              <div className="inline-flex items-center gap-2 py-2 px-4 mb-10 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider border border-white/10 shadow-xl">
                <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" /> Gestão completa ponta-a-ponta
              </div>

              <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-slate-950 mb-8 leading-[0.85] lg:max-w-5xl mx-auto drop-shadow-sm">
                Evolua sua Locadora <br /> para a <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 italic">Era Digital.</span>
              </h1>

              <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 mb-14 leading-relaxed font-medium">
                A primeira plataforma brasileira com inteligência preditiva para quem quer dominar o mercado de locação de ferramentas e equipamentos.
              </p>

              <div className="flex flex-col items-center gap-6">
                <Link href="/register">
                  <Button className="h-16 px-12 bg-slate-950 hover:bg-violet-700 text-white rounded-2xl text-sm font-bold uppercase tracking-widest shadow-2xl transition-all hover:-translate-y-1 hover:shadow-violet-200">
                    Começar agora Gratuitamente
                  </Button>
                </Link>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Check className="w-3 h-3 text-emerald-500" /> Sem cartão de crédito
                </span>
              </div>
            </motion.div>

            {/* Trusted By Row (Model Style) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-32 pt-12 border-t border-slate-100"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-12">Confiado por +50.000 negócios em crescimento</p>
              <div className="flex flex-wrap justify-center items-center gap-x-20 gap-y-10 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                {['Lumina', 'Vortex', 'Velocity', 'Synergy', 'Enigma', 'Spectrum'].map((brand) => (
                  <div key={brand} className="flex items-center gap-2 group cursor-default">
                    <div className="w-6 h-6 bg-slate-950 rounded-lg flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                      <Zap className="text-white w-3 h-3 fill-current" />
                    </div>
                    <span className="text-sm font-extrabold tracking-tight text-slate-950 uppercase">{brand}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Gradient Background Blobs */}
          <div className="absolute top-0 right-0 -z-20 w-[600px] h-[600px] bg-violet-200/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 -z-20 w-[600px] h-[600px] bg-blue-100/30 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2" />
        </section>

        <section className="py-32 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 text-center mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-600 shadow-[0_0_40px_rgba(124,58,237,0.3)] mb-8"
            >
              <Sparkles className="text-white w-8 h-8" />
            </motion.div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 mb-6 block">Visão Geral do Produto</span>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-950 mb-8">
              Locattus em um <span className="italic text-violet-600">Relance.</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
              Explore as poderosas ferramentas desenhadas para simplificar a gestão de locações, aumentar a colaboração e impulsionar a eficiência.
            </p>
          </div>

          <div className="max-w-[1200px] mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Decorative Glow behind the image */}
              <div className="absolute -inset-10 bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 blur-[120px] opacity-50 -z-10" />

              <div className="bg-white p-2 rounded-[2.5rem] shadow-[0_48px_80px_-16px_rgba(0,0,0,0.15)] border border-slate-100 ring-1 ring-slate-900/5">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-1 bg-slate-100 rounded-full z-20" />
                <img
                  src="/foto.PNG"
                  alt="Locattus Dashboard Preview"
                  className="rounded-[2rem] w-full"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Alternating Features (Model Style) */}
        <section id="features" className="py-24 space-y-32">
          {/* Feature 1: Intelligence */}
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-violet-600 font-extrabold uppercase tracking-[0.3em] text-[10px] mb-6 block">Inteligência Preditiva</span>
              <h2 className="text-4xl md:text-6xl font-extrabold text-slate-950 tracking-tight mb-8 leading-[1.1]">
                Monitore sua Frota <br /> mais rápido que nunca.
              </h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12">
                Acesse atualizações em tempo real para acompanhar o status de cada equipamento e faça ajustes rápidos na sua logística.
              </p>
              <div className="grid grid-cols-2 gap-10 border-t border-slate-100 pt-10">
                <div>
                  <div className="text-4xl font-extrabold text-slate-950 mb-1">100%</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-[10px]">Aumento em Rastreabilidade</div>
                </div>
                <div>
                  <div className="text-4xl font-extrabold text-slate-950 mb-1">10X</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-[10px]">Aumento em Produtividade</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-violet-600/5 blur-[100px] -z-10" />
              <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-slate-50">
                <img src="/foto-ferramentas.PNG" alt="Monitore sua Frota" className="rounded-[2rem] shadow-inner" />
              </div>
            </motion.div>
          </div>

          {/* Feature 2: Automation */}
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:order-2"
            >
              <span className="text-violet-600 font-extrabold uppercase tracking-[0.3em] text-[10px] mb-6 block">Automação de Faturamento</span>
              <h2 className="text-4xl md:text-6xl font-extrabold text-slate-950 tracking-tight mb-8 leading-[1.1]">
                Faturamento que <br /> trabalha para você.
              </h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12">
                Esqueça a cobrança manual. Nossa inteligência gera PIX dinâmicos e links de cartão automaticamente para cada contrato.
              </p>
              <Link href="/register">
                <Button className="h-14 px-8 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-widest">
                  Explorar Automações
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:order-1 relative"
            >
              <div className="absolute -inset-4 bg-indigo-600/5 blur-[100px] -z-10" />
              <div className="bg-slate-950 p-2 rounded-[2.5rem] shadow-2xl border border-white/5">
                <img src="/foto-financeiro.PNG" alt="Faturamento Automatizado" className="rounded-[2rem] opacity-90 shadow-2xl shadow-violet-500/20" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Tiers (Model Style) */}
        <section id="pricing" className="py-40 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-24">
            <span className="text-violet-600 font-extrabold uppercase tracking-[0.4em] text-[10px] mb-6 block font-jakarta">Investimento Estratégico</span>
            <h2 className="text-4xl md:text-6xl font-extrabold text-slate-950 tracking-tight mb-6">Planos que acompanham sua escala.</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-medium">Transparência total para você focar no que importa: seu crescimento.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-6 relative z-10">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={cn(
                  "p-10 rounded-[2.5rem] border flex flex-col transition-all duration-500 relative overflow-hidden group",
                  plan.popular
                    ? "bg-violet-600 text-white border-violet-500 shadow-[0_40px_100px_-20px_rgba(124,58,237,0.3)] z-20 scale-105"
                    : "bg-white border-slate-100 hover:border-violet-200 shadow-xl shadow-slate-100/50"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 p-6">
                    <Sparkles className="w-5 h-5 text-white/50" />
                  </div>
                )}

                <div className="mb-10">
                  <h3 className={cn("text-lg font-extrabold uppercase tracking-widest mb-4", plan.popular ? "text-violet-100" : "text-violet-600")}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className={cn("text-sm font-bold", plan.popular ? "text-white/60" : "text-slate-400")}>{plan.period}</span>
                  </div>
                  <p className={cn("mt-4 text-sm font-medium leading-relaxed", plan.popular ? "text-white/80" : "text-slate-500")}>{plan.description}</p>
                </div>

                <div className="space-y-5 mb-12 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", plan.popular ? "bg-white/20" : "bg-violet-50")}>
                        <Check className={cn("w-3 h-3", plan.popular ? "text-white" : "text-violet-600")} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest leading-none">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href="/register">
                  <Button className={cn(
                    "w-full h-14 rounded-xl font-extrabold uppercase tracking-[0.2em] text-[10px] transition-all",
                    plan.popular ? "bg-white text-violet-600 hover:bg-slate-50 shadow-xl shadow-black/10" : "bg-slate-950 text-white hover:bg-violet-700"
                  )}>
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* "All Plans Include" row (Model style) */}
          <div className="mt-24 max-w-4xl mx-auto px-6 text-center">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.3em] mb-10">Todos os planos incluem</p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40">
              {[
                { icon: Shield, label: 'Segurança Enterprise' },
                { icon: Users, label: 'Suporte Humano' },
                { icon: Globe, label: 'Backup Nuvem' },
                { icon: Zap, label: 'Integração API' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-slate-900" />
                  <span className="text-[10px] font-bold text-slate-950 uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Background Gradients */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[800px] h-[800px] bg-violet-50 blur-[150px] rounded-full" />
        </section>

        {/* Bottom Benefits Grid (Model Style) */}
        <section className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
            <div className="grid grid-cols-2 gap-4 lg:order-1">
              {[
                { title: 'Gestão Interna', icon: Shield, desc: 'Controle de permissões' },
                { icon: PieChart, title: 'Relatórios Custom', desc: 'BI para locadoras' },
                { icon: Users, title: 'CRM Integrado', desc: 'Gestão de clientes' },
                { icon: Clock, title: 'Logística Ágil', desc: 'Entrega e coleta' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm"
                >
                  <item.icon className="w-6 h-6 text-violet-600 mb-4" />
                  <h4 className="text-sm font-extrabold text-slate-950 mb-2 uppercase tracking-tight">{item.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="lg:order-2">
              <span className="text-violet-600 font-extrabold uppercase tracking-[0.3em] text-[10px] mb-6 block">Produtividade Máxima</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight mb-8 leading-[1.1]">
                Ferramentas de Gestão <br /> de Próxima Geração.
              </h2>
              <ul className="space-y-6">
                {[
                  'Classificação inteligente de ativos por lucro',
                  'Etiquetas customizáveis para rastreio rápido',
                  'Alertas de manutenção preditiva',
                  'Busca global instantânea em todo o acervo'
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <div className="w-2 h-2 bg-violet-600 rounded-full" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Refined Final CTA */}
        <section className="py-40 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-slate-950 rounded-[4rem] p-16 md:p-32 text-center relative overflow-hidden"
            >
              <div className="relative z-10">
                <h2 className="text-4xl md:text-7xl font-extrabold text-white tracking-tight mb-10 leading-[1]">
                  Assuma o comando da <br /> sua locadora <span className="text-violet-500 italic">hoje.</span>
                </h2>
                <p className="text-slate-400 text-lg mb-14 font-medium max-w-xl mx-auto">
                  Configuração em minutos. Resultados em horas. <br /> Junte-se à elite das locadoras digitais.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                  <Link href="/register">
                    <Button className="h-16 px-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-[0.2em] shadow-2xl shadow-violet-500/20 transition-all hover:scale-105 active:scale-95">
                      Criar minha conta Grátis
                    </Button>
                  </Link>
                  <Button variant="ghost" className="text-white hover:bg-white/10 h-16 px-10 rounded-2xl text-[10px] font-extrabold uppercase tracking-[0.2em]">
                    Agendar Demonstração
                  </Button>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(rgba(124,58,237,0.2) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-24 border-t border-slate-100 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-slate-950 rounded-xl flex items-center justify-center -rotate-6 shadow-xl">
                <Zap className="text-white w-4 h-4 fill-current" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-zinc-950">LOCATUS<span className="text-violet-600">PRO</span></span>
            </div>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              A plataforma definitiva para escala de locadoras de equipamentos. Desenvolvido com tecnologia de próxima geração.
            </p>
          </div>
          {[
            { title: 'Produto', links: ['Funcionalidades', 'Segurança', 'Planos', 'API Docs'] },
            { title: 'Empresa', links: ['Blog', 'Carreiras', 'Central de Ajuda', 'Cases'] },
            { title: 'Legal', links: ['Termos de Uso', 'Privacidade', 'Cookies', 'Compliance'] },
          ].map((col, idx) => (
            <div key={idx}>
              <h4 className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-slate-950 mb-8">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map((link, i) => (
                  <li key={i}><a href="#" className="text-xs font-bold text-slate-400 hover:text-violet-600 transition-colors uppercase tracking-widest">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-6 border-t border-slate-200/50 mt-20 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tracking-[0.2em]">© 2026 Locattus Intelligence. All rights reserved.</span>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Globe className="w-3 h-3" />
              <span>Português (BR)</span>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-violet-600 hover:text-white transition-all cursor-pointer">
                <Users2 className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper function for class merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
