# Execution Sequence
1. kubectl apply -f devtools/redis.yaml
2. kubectl apply -f devtools/pv.yaml
3. kubectl apply -f devtools/ingress.yaml
4. kubectl apply -f devtools/build/scraper-app.yaml

## Deployments - No Downtime
- kubectl get deployments
- kubectl set image deployment/scraper-app scraper-app=new/image:build


## Ingress
https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.6.4/deploy/static/provider/cloud/deploy.yaml