"use client";

import React from "react";

export const Integrations: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
          Integra tus aplicaciones favoritas
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          En nuestra plataforma, podrás integrar diversas herramientas y
          plataformas para optimizar tu flujo de trabajo y el éxito de tus
          proyectos.
        </p>
        <div className="flex flex-col md:flex-row gap-16 justify-center items-start md:items-stretch max-w-4xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow-md p-8 flex-1 min-w-[280px] max-w-md mx-auto">
            <ul className="space-y-6">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>
                  <span className="font-bold text-gray-900">
                    Control de versiones y gestión de código:
                  </span>
                  <span className="block text-gray-600 text-sm">
                    GitHub, GitLab, Bitbucket, GitPod, Branching Strategies,
                    SourceTree, GitKraken, entre otros.
                  </span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>
                  <span className="font-bold text-gray-900">
                    Herramientas de colaboración:
                  </span>
                  <span className="block text-gray-600 text-sm">
                    Slack, Microsoft Teams, Trello, Jira o Notion.
                  </span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>
                  <span className="font-bold text-gray-900">
                    Desarrollo y entornos de contenedores:
                  </span>
                  <span className="block text-gray-600 text-sm">
                    Docker, Kubernetes, Vagrant y Docker Compose.
                  </span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>
                  <span className="font-bold text-gray-900">
                    Visualización y diseño de frontend:
                  </span>
                  <span className="block text-gray-600 text-sm">
                    Figma, Sketch, Framer, Storybook, Webflow o Bubble.
                  </span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>
                  <span className="font-bold text-gray-900">
                    Inteligencia Artificial:
                  </span>
                  <span className="block text-gray-600 text-sm">
                    TensorFlow, PyTorch, Keras, Scikit-learn, OpenAI, entre
                    otros.
                  </span>
                </div>
              </li>
            </ul>
          </div>
          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow-md p-8 flex-1 min-w-[280px] max-w-md mx-auto">
            <ul className="space-y-6">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>
                  <span className="font-bold text-gray-900">Testeo y QA:</span>
                  <span className="block text-gray-600 text-sm">
                    Jest, Mocha, Cypress, Selenium, TestCafe, SonarQube o
                    Codacy.
                  </span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>
                  <span className="font-bold text-gray-900">
                    Infraestructura y Despliegue Continuo:
                  </span>
                  <span className="block text-gray-600 text-sm">
                    CICD, Jenkins, Travis CI, CircleCI, AWS, Azure y Google
                    Cloud.
                  </span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>
                  <span className="font-bold text-gray-900">
                    Gestión de Proyectos Ágiles:
                  </span>
                  <span className="block text-gray-600 text-sm">
                    Jira Agile, Trello (Scrum/Kanban), Monday y Targetprocess.
                  </span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>
                  <span className="font-bold text-gray-900">
                    Seguridad y gestión de identidades:
                  </span>
                  <span className="block text-gray-600 text-sm">
                    Okta, Auth0, Firebase Auth, entre otros.
                  </span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>
                  <span className="font-bold text-gray-900">
                    Analítica de Código:
                  </span>
                  <span className="block text-gray-600 text-sm">
                    Google Analytics, Mixpanel, Amplitude, New Relic, entre
                    otros.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
