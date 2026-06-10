pipeline {
    agent any

    stages {

        stage('Verify Docker') {
            steps {
                sh 'docker ps'
            }
        }

        stage('Pull Latest Code') {
            steps {
                sh '''
                cd /home/ubuntu/Food-Delivery-and-Dine-Out-Hospitality-Platform
                git pull origin main
                '''
            }
        }

        stage('Build Containers') {
            steps {
                sh '''
                cd /home/ubuntu/Food-Delivery-and-Dine-Out-Hospitality-Platform
                docker compose build
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                cd /home/ubuntu/Food-Delivery-and-Dine-Out-Hospitality-Platform
                docker compose up -d
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh 'curl -k -I https://foodhub.dedyn.io'
            }
        }
    }

    post {
        success {
            echo 'FoodHub deployed successfully'
        }

        failure {
            echo 'FoodHub deployment failed'
        }
    }
}