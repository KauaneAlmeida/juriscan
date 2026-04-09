import { Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
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
          Política de Privacidade
        </h1>
        <p className="text-gray-500 mb-8">
          Última atualização: Janeiro de 2025
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
          {/* Introdução */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              O Juriscan está comprometido com a proteção da privacidade e dos dados pessoais
              de seus usuários. Esta Política de Privacidade descreve como coletamos, usamos,
              armazenamos e protegemos suas informações, em conformidade com a Lei Geral de
              Proteção de Dados (Lei nº 13.709/2018 - LGPD).
            </p>
          </section>

          {/* 1. Dados Coletados */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              1. Dados que Coletamos
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Coletamos os seguintes tipos de dados:
            </p>

            <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">
              1.1 Dados de Cadastro
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Número da OAB (opcional)</li>
              <li>Telefone (opcional)</li>
              <li>Nome do escritório ou empresa (opcional)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">
              1.2 Dados de Uso
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Histórico de conversas com o assistente de IA</li>
              <li>Documentos enviados para análise</li>
              <li>Preferências e configurações da conta</li>
              <li>Registro de transações e uso de créditos</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">
              1.3 Dados Técnicos
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Endereço IP</li>
              <li>Tipo de navegador e dispositivo</li>
              <li>Páginas acessadas e tempo de permanência</li>
              <li>Cookies e tecnologias similares</li>
            </ul>
          </section>

          {/* 2. Finalidades */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              2. Finalidades do Tratamento
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Utilizamos seus dados para as seguintes finalidades:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>
                <strong>Prestação de serviços:</strong> fornecer acesso à plataforma e suas
                funcionalidades, incluindo o assistente de IA
              </li>
              <li>
                <strong>Comunicação:</strong> enviar notificações sobre sua conta, atualizações
                do serviço e informações relevantes
              </li>
              <li>
                <strong>Processamento de pagamentos:</strong> gerenciar assinaturas, créditos
                e transações financeiras
              </li>
              <li>
                <strong>Melhoria do serviço:</strong> analisar o uso da plataforma para
                aprimorar funcionalidades e experiência do usuário
              </li>
              <li>
                <strong>Segurança:</strong> prevenir fraudes e proteger a integridade da
                plataforma
              </li>
              <li>
                <strong>Cumprimento legal:</strong> atender obrigações legais e regulatórias
              </li>
            </ul>
          </section>

          {/* 3. Base Legal */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              3. Base Legal para o Tratamento
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              O tratamento de seus dados pessoais é realizado com base nas seguintes
              hipóteses legais previstas na LGPD:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>
                <strong>Execução de contrato:</strong> para prestação dos serviços contratados
              </li>
              <li>
                <strong>Consentimento:</strong> para atividades opcionais, como comunicações
                de marketing
              </li>
              <li>
                <strong>Legítimo interesse:</strong> para melhoria e segurança da plataforma
              </li>
              <li>
                <strong>Cumprimento de obrigação legal:</strong> quando exigido por lei
              </li>
            </ul>
          </section>

          {/* 4. Compartilhamento */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              4. Compartilhamento de Dados
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Seus dados podem ser compartilhados com:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>
                <strong>Processadores de pagamento:</strong> Pagar.me, para processamento
                seguro de transações
              </li>
              <li>
                <strong>Provedores de infraestrutura:</strong> serviços de hospedagem e
                banco de dados (Supabase, Vercel)
              </li>
              <li>
                <strong>Provedores de IA:</strong> Anthropic (Claude) e OpenAI, para processamento das consultas
                ao assistente e transcrição de áudio (sem identificação pessoal)
              </li>
              <li>
                <strong>Autoridades:</strong> quando exigido por lei ou ordem judicial
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Não vendemos seus dados pessoais a terceiros.
            </p>
          </section>

          {/* 5. Armazenamento */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              5. Armazenamento e Segurança
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Seus dados são armazenados em servidores seguros com as seguintes medidas
              de proteção:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Criptografia em trânsito (HTTPS/TLS) e em repouso</li>
              <li>Controle de acesso baseado em funções</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares</li>
              <li>Políticas de retenção adequadas ao tipo de dado</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Os dados são retidos enquanto sua conta estiver ativa ou conforme necessário
              para cumprir obrigações legais. Após exclusão da conta, os dados são removidos
              em até 30 dias, exceto quando a retenção for legalmente exigida.
            </p>
          </section>

          {/* 6. Direitos do Titular */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              6. Seus Direitos
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Conforme a LGPD, você tem os seguintes direitos:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>
                <strong>Confirmação e acesso:</strong> saber se tratamos seus dados e
                acessar as informações
              </li>
              <li>
                <strong>Correção:</strong> solicitar a correção de dados incompletos ou
                desatualizados
              </li>
              <li>
                <strong>Anonimização ou eliminação:</strong> solicitar a exclusão de dados
                desnecessários
              </li>
              <li>
                <strong>Portabilidade:</strong> obter cópia de seus dados em formato estruturado
              </li>
              <li>
                <strong>Revogação do consentimento:</strong> retirar consentimento a qualquer
                momento
              </li>
              <li>
                <strong>Oposição:</strong> opor-se a tratamentos específicos
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Para exercer seus direitos, entre em contato através do e-mail indicado
              ao final desta política.
            </p>
          </section>

          {/* 7. Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              7. Cookies e Tecnologias Similares
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Utilizamos cookies para:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>
                <strong>Cookies essenciais:</strong> necessários para o funcionamento da
                plataforma e autenticação
              </li>
              <li>
                <strong>Cookies de preferência:</strong> para lembrar suas configurações
              </li>
              <li>
                <strong>Cookies analíticos:</strong> para entender como a plataforma é
                utilizada
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Você pode gerenciar as preferências de cookies através das configurações
              do seu navegador.
            </p>
          </section>

          {/* 8. Transferência Internacional */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              8. Transferência Internacional de Dados
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Alguns de nossos prestadores de serviço podem estar localizados fora do Brasil.
              Nestes casos, garantimos que a transferência seja realizada com níveis adequados
              de proteção, através de cláusulas contratuais padrão ou outros mecanismos
              reconhecidos pela legislação aplicável.
            </p>
          </section>

          {/* 9. Menores */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              9. Dados de Menores
            </h2>
            <p className="text-gray-600 leading-relaxed">
              O Juriscan é destinado a profissionais do direito e não coleta intencionalmente
              dados de menores de 18 anos. Se tomarmos conhecimento de que coletamos dados
              de um menor, tomaremos medidas para excluí-los prontamente.
            </p>
          </section>

          {/* 10. Alterações */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              10. Alterações nesta Política
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Esta Política de Privacidade pode ser atualizada periodicamente. Alterações
              significativas serão comunicadas através da plataforma ou por e-mail.
              Recomendamos revisar esta política regularmente para estar ciente de como
              protegemos suas informações.
            </p>
          </section>

          {/* DPO / Contato */}
          <section className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Encarregado de Proteção de Dados (DPO)
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Para questões relacionadas à privacidade e proteção de dados, ou para
              exercer seus direitos como titular de dados, entre em contato:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
              <p><strong>E-mail:</strong> <span className="text-primary">privacidade@juriscan.com.br</span></p>
              <p className="mt-1"><strong>E-mail geral:</strong> <span className="text-primary">contato@juriscan.com.br</span></p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-primary transition-colors">
            Termos de Uso
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
