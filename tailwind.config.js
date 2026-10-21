/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], // لازم تحدد الملفات اللي فيها الكلاسات، وإلا مش هيطلع ستايل
  theme: {
    extend: {
      colors: {
        // ===== الخلفيات =====
        page: "#F3E9DC", // bg-page → خلفية الصفحات
        surface: {
          DEFAULT: "#FAF5EC", // bg-surface → خلفية الكروت
          muted: "#DDD0BF", // bg-surface-muted → الأقسام الثانوية
          dark: "#141210", // bg-surface-dark → الأقسام الداكنة
        },

        // ===== النصوص =====
        heading: "#141210", // text-heading → العناوين والنص الأساسي
        muted: "#6B6257", // text-muted → النص الثانوي

        // ===== الذهبي =====
        gold: {
          DEFAULT: "#C9962B", // text-gold / bg-gold
          hover: "#E3B04B", // bg-gold-hover → عند الـ hover
          pressed: "#8A6420", // bg-gold-pressed → عند الضغط (active)
        },

        // ===== الحالات =====
        success: "#3E7D4F", // text-success → نجاح
        error: "#B3402F", // text-error → خطأ

        // ===== الأزرار =====
        primary: {
          DEFAULT: "#141210", // bg-primary → الزر الأساسي
          hover: "#2B2723", // hover:bg-primary-hover
          foreground: "#FAF5EC", // text-primary-foreground → نص الزر الأساسي
        },

        // ===== الحدود =====
        border: {
          DEFAULT: "rgb(138 100 32 / 22%)", // border-border → الحد الأساسي
          strong: "#8A6420", // border-border-strong → الحد القوي
          dark: "rgb(201 150 43 / 30%)", // border-border-dark → فوق الخلفية الداكنة (القيمة دي من عندي، عدّلها)
        },
      },

      fontFamily: {
        heading: ['"Cinzel"', "serif"], // font-heading → العناوين
        body: ['"Inter"', "sans-serif"], // font-body → النصوص
      },

      boxShadow: {
        luxury: "0 12px 40px -12px rgb(20 18 16 / 25%)", // shadow-luxury (القيمة من عندي، عدّلها)
      },

      backgroundImage: {
        "gold-cta": "linear-gradient(135deg, #E3B04B 0%, #8A6420 100%)", // bg-gold-cta → زر Gold CTA
      },
    },
  },
  plugins: [],
};
