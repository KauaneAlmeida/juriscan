import { Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-primary" strokeWidth={1.5} />
            <span className="text-xl font-semibold text-gray-800">Juriscan</span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao login
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Termos de Uso
        </h1>
        <p className="text-gray-500 mb-8">
          Última atualização: Janeiro de 2025
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
          {/* 1. Aceitação */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              1. Aceitação dos Termos
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Ao acessar e utilizar a plataforma Juriscan, você concorda em cumprir e estar
              vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes
              termos, não deverá utilizar nossos serviços. O uso continuado da plataforma
              constitui aceitação de quaisquer alterações futuras nestes termos.
            </p>
          </section>

          {/* 2. Descrição do Serviço */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              2. Descrição do Serviço
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              O Juriscan é uma plataforma de tecnologia jurídica que oferece:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Assistente jurídico baseado em inteligência artificial</li>
              <li>Análise de documentos e contratos</li>
              <li>Ferramentas de jurimetria e análise preditiva</li>
              <li>Geração de relatórios e pareceres</li>
            </ul>
          </section>

          {/* 3. Cadastro e Conta */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              3. Cadastro e Conta
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Para utilizar nossos serviços, você deve criar uma conta fornecendo informações
              verdadeiras, completas e atualizadas. Você é responsável por manter a
              confidencialidade de suas credenciais de acesso e por todas as atividades
              realizadas em sua conta. Notifique-nos imediatamente sobre qualquer uso não
              autorizado de sua conta.
            </p>
          </section>

          {/* 4. Pagamentos e Créditos */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              4. Pagamentos e Créditos
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              O uso da plataforma é baseado em um sistema de créditos:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Novos usuários recebem créditos iniciais para teste</li>
              <li>Créditos adicionais podem ser adquiridos através de pacotes ou assinaturas</li>
              <li>Os créditos são consumidos conforme o uso das funcionalidades</li>
              <li>Créditos não utilizados não são reembolsáveis, exceto quando previsto em lei</li>
              <li>Os preços podem ser alterados com aviso prévio de 30 dias</li>
            </ul>
          </section>

          {/* 5. Uso Adequado */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              5. Uso Adequado
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Ao utilizar o Juriscan, você concorda em:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Não violar leis ou regulamentos aplicáveis</li>
              <li>Não tentar acessar áreas restritas do sistema</li>
              <li>Não compartilhar sua conta com terceiros</li>
              <li>Não utilizar o serviço para atividades fraudulentas ou ilegais</li>
              <li>Não sobrecarregar ou interferir no funcionamento da plataforma</li>
            </ul>
          </section>

          {/* 6. Limitações da IA */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              6. Limitações do Assistente de IA
            </h2>
            <p className="text-gray-600 leading-relaxed">
              O assistente jurídico do Juriscan utiliza inteligência artificial para fornecer
              informações e análises. No entanto, as respostas geradas pela IA são de natureza
              informativa e <strong>não constituem aconselhamento jurídico profissional</strong>.
              Recomendamos sempre consultar um advogado qualificado para decisões jurídicas
              importantes. O Juriscan não se responsabiliza por decisões tomadas com base
              exclusivamente nas informações fornecidas pelo assistente de IA.
            </p>
          </section>

          {/* 7. Propriedade Intelectual */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              7. Propriedade Intelectual
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Todo o conteúdo da plataforma, incluindo textos, gráficos, logos, ícones, imagens,
              software e código-fonte, é propriedade do Juriscan ou de seus licenciadores e está
              protegido por leis de propriedade intelectual. O conteúdo que você criar ou enviar
              para a plataforma permanece de sua propriedade, mas você nos concede uma licença
              para processá-lo conforme necessário para a prestação dos serviços.
            </p>
          </section>

          {/* 8. Privacidade */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              8. Privacidade e Proteção de Dados
            </h2>
            <p className="text-gray-600 leading-relaxed">
              O tratamento de seus dados pessoais é regido por nossa{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
              , que faz parte integrante destes Termos de Uso. Ao utilizar nossos serviços,
              você concorda com as práticas descritas em nossa política de privacidade,
              em conformidade com a Lei Geral de Proteção de Dados (LGPD).
            </p>
          </section>

          {/* 9. Limitação de Responsabilidade */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              9. Limitação de Responsabilidade
            </h2>
            <p className="text-gray-600 leading-relaxed">
              O Juriscan é fornecido &quot;como está&quot; e &quot;conforme disponível&quot;. Não garantimos
              que o serviço será ininterrupto, livre de erros ou completamente seguro.
              Em nenhuma hipótese seremos responsáveis por danos indiretos, incidentais,
              especiais ou consequenciais decorrentes do uso ou impossibilidade de uso
              da plataforma, na máxima extensão permitida pela lei aplicável.
            </p>
          </section>

          {/* 10. Rescisão */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              10. Rescisão
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Você pode encerrar sua conta a qualquer momento através das configurações da
              plataforma. Reservamo-nos o direito de suspender ou encerrar seu acesso em caso
              de violação destes termos. Após o encerramento, seus dados serão tratados
              conforme nossa Política de Privacidade e a legislação aplicável.
            </p>
          </section>

          {/* 11. Alterações */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              11. Alterações nos Termos
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Podemos atualizar estes Termos de Uso periodicamente. Alterações significativas
              serão comunicadas através da plataforma ou por e-mail. O uso continuado do
              serviço após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          {/* 12. Foro */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              12. Legislação Aplicável e Foro
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil.
              Qualquer disputa relacionada a estes termos será resolvida no foro da comarca
              de São Paulo, Estado de São Paulo, com exclusão de qualquer outro, por mais
              privilegiado que seja.
            </p>
          </section>

          {/* Contato */}
          <section className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Contato
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Para dúvidas sobre estes Termos de Uso, entre em contato conosco através do
              e-mail: <span className="text-primary">contato@juriscan.com.br</span>
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Política de Privacidade
          </Link>
          <span>•</span>
          <Link href="/login" className="hover:text-primary transition-colors">
            Fazer Login
          </Link>
          <span>•</span>
          <Link href="/register" className="hover:text-primary transition-colors">
            Criar Conta
          </Link>
        </div>
      </main>
    </div>
  );
}
