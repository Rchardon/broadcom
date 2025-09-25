<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_IDENTIFIANT', fields: ['identifiant'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    private ?string $identifiant = null;

    /**
     * @var list<string> The user roles
     */
    #[ORM\Column]
    private array $roles = [];

    /**
     * @var string The hashed password
     */
    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(length: 255)]
    private ?string $Nom = null;

    #[ORM\Column(length: 255)]
    private ?string $Prénom = null;

    #[ORM\Column]
    private ?int $noApp = null;

    #[ORM\Column]
    private ?int $pin = null;

    #[ORM\Column]
    private ?bool $isActive = null;

    /**
     * @var Collection<int, Message>
     */
    #[ORM\OneToMany(targetEntity: Message::class, mappedBy: 'Envoyeur', orphanRemoval: true)]
    private Collection $messages;

    /**
     * @var Collection<int, Conversation>
     */
    #[ORM\OneToMany(targetEntity: Conversation::class, mappedBy: 'utilisateur1', orphanRemoval: true)]
    private Collection $conversations1;

    /**
     * @var Collection<int, Conversation>
     */
    #[ORM\OneToMany(targetEntity: Conversation::class, mappedBy: 'utilisateur2', orphanRemoval: true)]
    private Collection $conversations2;

    public function __construct()
    {
        $this->conversations2 = new ArrayCollection();
        $this->messages = new ArrayCollection();
        $this->conversations1 = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getIdentifiant(): ?string
    {
        return $this->identifiant;
    }

    public function setIdentifiant(string $identifiant): static
    {
        $this->identifiant = $identifiant;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     *
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->identifiant;
    }

    /**
     * @see UserInterface
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        // guarantee every user at least has ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    /**
     * @param list<string> $roles
     */
    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    /**
     * Ensure the session doesn't contain actual password hashes by CRC32C-hashing them, as supported since Symfony 7.3.
     */
    public function __serialize(): array
    {
        $data = (array) $this;
        $data["\0".self::class."\0password"] = hash('crc32c', $this->password);

        return $data;
    }

    #[\Deprecated]
    public function eraseCredentials(): void
    {
        // @deprecated, to be removed when upgrading to Symfony 8
    }

    public function getNom(): ?string
    {
        return $this->Nom;
    }

    public function setNom(string $Nom): static
    {
        $this->Nom = $Nom;

        return $this;
    }

    public function getPrénom(): ?string
    {
        return $this->Prénom;
    }

    public function setPrénom(string $Prénom): static
    {
        $this->Prénom = $Prénom;

        return $this;
    }

    public function getNoApp(): ?int
    {
        return $this->noApp;
    }

    public function setNoApp(int $noApp): static
    {
        $this->noApp = $noApp;

        return $this;
    }

    public function getPin(): ?int
    {
        return $this->pin;
    }

    public function setPin(int $pin): static
    {
        $this->pin = $pin;

        return $this;
    }

    public function isActive(): ?bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    /**
     * @return Collection<int, Message>
     */
    public function getMessages(): Collection
    {
        return $this->messages;
    }

    public function addMessage(Message $message): static
    {
        if (!$this->messages->contains($message)) {
            $this->messages->add($message);
            $message->setEnvoyeur($this);
        }

        return $this;
    }

    public function removeMessage(Message $message): static
    {
        if ($this->messages->removeElement($message)) {
            // set the owning side to null (unless already changed)
            if ($message->getEnvoyeur() === $this) {
                $message->setEnvoyeur(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Conversation>
     */
    public function getConversations1(): Collection
    {
        return $this->conversations1;
    }

    public function addConversations1(Conversation $conversations1): static
    {
        if (!$this->conversations1->contains($conversations1)) {
            $this->conversations1->add($conversations1);
            $conversations1->setUtilisateur1($this);
        }

        return $this;
    }

    public function removeConversations1(Conversation $conversations1): static
    {
        if ($this->conversations1->removeElement($conversations1)) {
            // set the owning side to null (unless already changed)
            if ($conversations1->getUtilisateur1() === $this) {
                $conversations1->setUtilisateur1(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Conversation>
     */
    public function getConversations2(): Collection
    {
        return $this->conversations2;
    }

    public function addConversations2(Conversation $conversations2): static
    {
        if (!$this->conversations2->contains($conversations2)) {
            $this->conversations2->add($conversations2);
            $conversations2->setUtilisateur2($this);
        }

        return $this;
    }

    public function removeConversations2(Conversation $conversations2): static
    {
        if ($this->conversations2->removeElement($conversations2)) {
            // set the owning side to null (unless already changed)
            if ($conversations2->getUtilisateur2() === $this) {
                $conversations2->setUtilisateur2(null);
            }
        }

        return $this;
    }
}
