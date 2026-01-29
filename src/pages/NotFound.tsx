import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientBackground } from "@/components/landing/GradientBackground";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Gradient */}
      <div className="fixed inset-0 z-0">
        <GradientBackground />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center p-6"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 md:p-14 border border-white/20 shadow-2xl max-w-md mx-auto">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-white/90" />
            </div>
          </motion.div>

          {/* Error Code */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-7xl md:text-8xl font-bold text-white mb-2 tracking-tight"
          >
            404
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-white/80 mb-8"
          >
            Página não encontrada
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-white/60 mb-8"
          >
            A página que você está procurando pode ter sido removida ou não existe.
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="text-white/90 hover:text-white hover:bg-white/10 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Link to="/dashboard">
              <Button className="w-full sm:w-auto gap-2 bg-white text-primary hover:bg-white/90 font-semibold">
                <Home className="h-4 w-4" />
                Ir ao Dashboard
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-sm text-white/50 mt-8"
        >
          © {new Date().getFullYear()} Escola Maranata
        </motion.p>
      </motion.div>
    </div>
  );
};

export default NotFound;
