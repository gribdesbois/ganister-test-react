# IP Filtering

Ganister PLM, whether it is deployed on the cloud or on premise, has an embedded IP filtering middleware which allows to limit accesses to the Ganister PLM Instance webservice.

# Configuration

For now we only support dedicated IP addresses, not ranges.
In the .env file you need to configure the following lines : 


    # IP RESTRICTIONS
    IPRESTRICTED=false
    ALLOWEDIPS=::1,127.0.0.1

- IPRESTRICTED : true = IP filtering is enabled - false = IP filtering is disabled (accesses are allowed for all)
- ALLOWEDIPS : Comma separated list of IP addresses allowed to access the Ganister PLM instance. It is only applicable if IPRESTRICTED = true