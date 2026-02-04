# Setting up Backend
- Install Java with jdk version `21`
- Install Maven with version `3.9.11` 
  
If you are using VSCode, Use commands below: 
- `cd Server` to go to the server directory
- `mvn clean install` to install dependencies
- `mvn spring-boot:run` to run the application

# Setting up Client
- Install Node.js with version `18` or higher
- Install npm (comes with Node.js) or use `npm` version `9` or higher
  
If you are using VSCode, Use commands below: 
- `cd Client` to go to the client directory
- `npm install` to install dependencies
- `npm run dev` to run the development server


# Script to create environment for AWS 
```bash
    # Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 24

# Verify the Node.js version:
node -v # Should print "v24.13.0".

# Verify npm version:
npm -v # Should print "11.6.2".

# Setting up Java with Maven now
sudo dnf install java-21-amazon-corretto maven-amazon-corretto21


# Install docker on host
sudo yum install -y docker




# We want to run docker without root
sudo usermod -a -G docker ec2-user

# Need to associate Elastic IP so that IP of Instance doesn't change
# Create Elastic IP first, and then associate it by clicking that IP and adding an instance

```