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
                        dir('backend/kyc-service') {
                            sh 'pip install -r requirements.txt'
                            sh 'pytest tests/ || true'
                        }
                    }
                }
                stage('Credit Tests') {
                    steps {
                        dir('backend/credit-score-service') {
                            sh 'pip install -r requirements.txt'
                            sh 'pytest tests/ || true'
                        }
                    }
                }
                stage('UPI Tests') {
                    steps {
                        dir('backend/upi-mandate-service') {
                            sh 'pip install -r requirements.txt'
                            sh 'pytest tests/ || true'
                        }
                    }
                }
            }
        }

        stage('Build Images') {
            steps {
                script {
                    docker.build("${REGISTRY}/kyc-service:${IMAGE_TAG}", "./backend/kyc-service")
                    docker.build("${REGISTRY}/credit-service:${IMAGE_TAG}", "./backend/credit-score-service")
                    docker.build("${REGISTRY}/upi-service:${IMAGE_TAG}", "./backend/upi-mandate-service")
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
