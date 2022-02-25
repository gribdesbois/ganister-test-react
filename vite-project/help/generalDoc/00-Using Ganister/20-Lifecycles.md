# Lifecycles

## Concept

Lifecycles are configured with States, Transitions and Roles.

### States
A node has only one active state at a time. A state has a role and can have multiple transitions. If a state is missing a role it might be because it is a system.
### Transitions
A transition links two states. The role assigned to the source state is allowed to promote to the target state. It can triggered specific events
### Roles
Roles are defined so that we can identify who is responsible for a specific state. We assign a specific user to each role to allow this person to promote a lifecycle from the state their role is allowed for promoting.

## Lifecycle Video Presentation

<iframe width="100%" style="aspect-ratio: 16 / 9;" src="https://www.youtube.com/embed/teQmMxbBj00" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>