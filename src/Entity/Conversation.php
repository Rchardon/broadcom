<?php

namespace App\Entity;

use App\Repository\ConversationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ConversationRepository::class)]
class Conversation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * @var Collection<int, Message>
     */
    #[ORM\OneToMany(targetEntity: Message::class, mappedBy: 'Conversation', orphanRemoval: true)]
    private Collection $messages;

    #[ORM\ManyToOne(inversedBy: 'conversations1')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $utilisateur1 = null;

    #[ORM\ManyToOne(inversedBy: 'conversations2')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $utilisateur2 = null;

    public function __construct()
    {
        $this->messages = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
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
            $message->setConversation($this);
        }

        return $this;
    }

    public function removeMessage(Message $message): static
    {
        if ($this->messages->removeElement($message)) {
            // set the owning side to null (unless already changed)
            if ($message->getConversation() === $this) {
                $message->setConversation(null);
            }
        }

        return $this;
    }

    public function getUtilisateur1(): ?User
    {
        return $this->utilisateur1;
    }

    public function setUtilisateur1(?User $utilisateur1): static
    {
        $this->utilisateur1 = $utilisateur1;

        return $this;
    }

    public function getUtilisateur2(): ?User
    {
        return $this->utilisateur2;
    }

    public function setUtilisateur2(?User $utilisateur2): static
    {
        $this->utilisateur2 = $utilisateur2;

        return $this;
    }
}
