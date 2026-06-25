FROM nginx:alpine

# Copy static frontend files to Nginx default html directory
COPY ./frontend /usr/share/nginx/html/

# Copy the custom Nginx configuration
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
