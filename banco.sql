create type tipo_consulta as enum ('avaliação','limpeza','manutenção','outro');

create table cliente (
    id serial primary key,
    nome varchar(255) not null,
    email varchar(255) not null,
    senha varchar(50) not null,
    cpf varchar(11) unique not null
);

create table dentista (
    id serial primary key,
    nome varchar(255) not null,
    email varchar(255) not null,
    senha varchar(50) not null
);

create table consulta (
    id serial primary key,
    tipo tipo_consulta not null,
    descricao text not null,
    data_consulta timestamp not null,
    id_dentista integer not null references dentista(id) on delete cascade,
    id_cliente integer not null references cliente(id) on delete cascade
);
