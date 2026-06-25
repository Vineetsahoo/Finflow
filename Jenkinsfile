pipeline {
    agent any

    environment {
        REGISTRY = 'localhost:5000'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            parallel {
                stage('KYC Tests') {
                    steps {
                        dir('backend/kyc_service') {
                            // TODO: Add actual tests. Using echo to prevent pipeline failure.
                            sh 'echo "No KYC tests configured yet. Skipping..."'
                        }
                    }
                }
                stage('Credit Tests') {
                    steps {
                        dir('backend/credit_score_service') {
                            // TODO: Add actual tests. Using echo to prevent pipeline failure.
                            sh 'echo "No Credit tests configured yet. Skipping..."'
                        }
                    }
                }
                stage('UPI Tests') {
                    steps {
                        dir('backend/upi_mandate_service') {
                            // TODO: Add actual tests. Using echo to prevent pipeline failure.
                            sh 'echo "No UPI tests configured yet. Skipping..."'
                        }
                    }
                }
            }
        }

        // Uncomment and configure SonarQube on your Jenkins server when ready
        // stage('SonarQube Analysis') {
        //     steps {
        //         script {
        //             def scannerHome = tool 'SonarQubeScanner'
        //             withSonarQubeEnv('SonarQube') {
        //                 sh "${scannerHome}/bin/sonar-scanner"
        //             }
        //         }
        //     }
        // }

        stage('Build Docker Images') {
            steps {
                script {
                    // Using docker-compose to build ensures all contexts and Dockerfiles are matched
                    // exactly as defined in docker-compose.yml
                    sh 'docker-compose -f docker-compose.yml build'
                    
                    // Alternatively, if you need to push to a private registry:
                    // docker.build("${REGISTRY}/kyc-service:${IMAGE_TAG}", "./backend/kyc_service")
                    // docker.build("${REGISTRY}/credit-score-service:${IMAGE_TAG}", "./backend/credit_score_service")
                    // docker.build("${REGISTRY}/upi-mandate-service:${IMAGE_TAG}", "./backend/upi_mandate_service")
                    // docker.build("${REGISTRY}/celery-worker:${IMAGE_TAG}", "-f backend/celery_worker/Dockerfile .")
                    // docker.build("${REGISTRY}/celery-beat:${IMAGE_TAG}", "-f backend/celery_beat/Dockerfile .")
                }
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker-compose -f docker-compose.yml up -d'
            }
        }
    }
}
